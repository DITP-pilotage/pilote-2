# Objectifs dérivés par agrégation hiérarchique

Date : 2026-05-28
Statut : implémenté

## Contexte métier

### Le modèle

Les concepts d'indicateur, référentiel, individu, relation et fonction d'agrégation sont décrits dans [séries de valeurs dérivées](indicateur-derives.md). L'**objectif** (`ObjectifIndicateurIndividu`) est l'autre face : là où une valeur d'avancement mesure l'état à un instant, l'objectif déclare une cible à atteindre pour une date donnée — `(indicateur, individu, dateCible) → valeurCible`.

### Saisies vs objectifs dérivés

Comme pour les valeurs, les agents saisissent leurs objectifs à leur propre maille. Un responsable régional peut ne pas saisir d'objectif global : celui-ci est **reconstruit** en agrégeant les objectifs que ses enfants (départements, etc.) ont déclarés.

La règle de feuille / agrégé est identique : c'est la `fonctionAgregation` portée par `IndicateurReferentiel` du référentiel de l'individu qui décide. `NONE` → feuille ; `SUM` ou `AVG` → agrégé.

### Différence sémantique avec les valeurs : strict plutôt que permissif

Pour les valeurs d'avancement, un parent peut émettre un point dès qu'un seul enfant a une valeur (permissif, avec couverture partielle visible). Pour les objectifs, la sémantique est **stricte** : un objectif dérivé n'est émis que si *tous* les enfants ont un objectif connu. Un enfant sans historique d'objectif bloque entièrement le parent.

Motivation produit : un objectif agrégé partiel n'a pas de sens contractuellement. Il vaut mieux ne pas en afficher un plutôt qu'en afficher un biaisé.

## Objet

Exposer, pour un indicateur donné, les objectifs d'un individu — qu'il soit feuille (saisies directes) ou agrégé (valeurs reconstruites par agrégation stricte de ses enfants). Le même endpoint `GET /indicateurs/:id/objectifs` sert les deux cas.

## Architecture en couches

```
HTTP route  ─►  use case              ─►  functional core       ◄──  TypedSQL
/objectifs      listObjectifsFor…ts       resolveObjectifInd…       getObjectifsTronques…sql
                (orchestration I/O)       (pur, mémoïsé)            (bulk, par bucket)
```

Même patron que les valeurs dérivées, trois responsabilités séparées :

- **Use case** (`queries/listObjectifsForIndicateur.ts`) — orchestration des I/O : permissions, chargement du contexte, itération sur les cibles. Aucun calcul métier.
- **Functional core** (`resolveObjectifIndividu.ts`) — algorithme pur, sans Prisma. Prend un `ResolveObjectifContext` en mémoire, retourne des maps bucket → point. Mémoïsé par `individuId`.
- **TypedSQL** (`prisma/sql/getObjectifsTronquesPourIndividus.sql`) — requête bulk qui charge les objectifs pré-tronqués et pré-dédoublonnés pour tous les individus du sous-arbre.

Les loaders DB partagés (`loadSousArbre`, `loadFonctionsAgregation`) sont réutilisés depuis `indicateur/queries/loadIndicateurIndividuContext.ts`, commun avec les valeurs dérivées.

## Cycle de vie d'une requête

`buildList` (`listObjectifsForIndicateur.ts:34`) déroule trois phases :

1. **Résolution des cibles** — `loadIndividusParPublicId` traduit les `publicId` demandés en `id` internes + `referentielId`.
2. **Chargement bulk en parallèle** :
   - `loadSousArbre` — BFS itératif sur `relation`. Construit `enfantsParParent` et `allNodes`.
   - `loadFonctionsAgregation` — map `referentielId → FonctionAgregation` pour l'indicateur courant.
   - Puis `loadObjectifsBucketises` (séquentiel : a besoin de `allNodes`) — une requête `$queryRawTyped` pour tous les objectifs, déjà groupés par bucket via `date_trunc` Postgres.
3. **Calcul** — pour chaque cible, `resolveObjectifIndividu` produit une map bucket → point ; on aplatit et trie en sortie, puis on convertit en `ObjectifIndicateurIndividuApiModel`.

## Calcul des objectifs

### Distinction feuille / agrégé

`getFonctionAgregationActive` (partagé dans `resolveAgregation.ts`) : un individu est agrégé s'il a au moins un enfant direct *et* que son référentiel est lié à l'indicateur avec `fonctionAgregation ≠ NONE`. Sinon feuille.

Conséquence : si un individu agrégé a des objectifs saisis directement, ils sont **ignorés**. L'objectif exposé est toujours la dérivée.

### Cas feuille

Trivial : on retourne la map `bucket → { type: 'saisie', valeur }` issue du chargement SQL. Un point par bucket après déduplication.

### Cas agrégé : carry-forward strict

`computeObjectifDerive` (`resolveObjectifIndividu.ts:62`). Pour chaque enfant direct, on récupère récursivement sa résolution (feuille ou dérivée). On fusionne ensuite en deux passes :

1. **Union des buckets** — tous les buckets distincts présents chez au moins un enfant, triés ASC. Squelette temporel du parent.
2. **Sweep avec pointers** — on parcourt les buckets en ordre croissant. Pour chaque enfant, un pointer avance tant que le prochain bucket de l'enfant est ≤ bucket courant. La valeur courante est donc *sa dernière valeur connue* — le carry-forward.

À chaque bucket :

- Si **tous** les enfants ont un pointer valide (≥ 0) → `agreger()` → émettre un point `derivee`.
- Si **un seul** enfant n'a pas encore de valeur portée → bucket ignoré, aucun point émis.

**Strict** signifie : on n'émet pas de point tant que la couverture n'est pas complète. Il n'y a pas de notion de `couverture` ni de contribution `manquante` dans la réponse — soit tous les enfants ont contribué, soit le point n'existe pas.

### Mémoïsation

`resolveObjectifIndividu` consulte un cache `Map<individuId, ReadonlyMap<bucket, PointObjectifInterne>>` local à la requête. Pour un appel multi-cibles, chaque sous-arbre n'est calculé qu'une fois.

### Dédoublonnage par bucket (côté SQL)

Si un individu a plusieurs objectifs dans le même bucket, on conserve **le plus récent** (par `dateCible DESC, id DESC`). L'algorithme voit déjà une série propre à un point par bucket.

## Modèle de réponse

Discriminated union sur `type` :

```ts
type ObjectifIndicateurIndividuApiModel =
  | { type: 'saisie'
      indicateur; individu; dateCible; valeurCible }
  | { type: 'derivee'
      indicateur; individu; dateCible; valeurCible
      fonctionAgregation: 'SUM' | 'AVG'
      contributions: Array<{
        individu: string        // publicId de l'enfant direct
        valeurCible: number     // valeur portée par carry-forward
        dateCible: string       // bucket de la valeur portée (≤ dateCible parent)
        source: 'saisie' | 'derivee'
      }> }
```

`dateCible` sur l'objectif dérivé est le **bucket parent** (post-troncature). `dateCible` dans chaque contribution est le bucket de la valeur portée par l'enfant, qui peut être antérieur si la dernière saisie de l'enfant remonte à un bucket précédent.

On n'expose **pas** de `couverture` (la rigueur stricte garantit que toutes les contributions sont présentes). On n'expose pas non plus les contributions transitives — le client interroge l'enfant agrégé pour drill-down.

Query params :

- `individus` — 1..100 publicIds
- `dateTrunc` — `day | week | month | quarter | year`, **défaut `year`**

## Choix techniques & tradeoffs

### Strict vs permissif

On a choisi la sémantique stricte (tous les enfants doivent avoir un objectif) plutôt que permissive (comme les valeurs). Côté produit : un objectif agrégé représente un engagement contractuel. En afficher un biaisé (certains enfants n'ont pas encore saisi) pourrait induire en erreur. La couverture partielle est acceptable pour une valeur d'avancement historique ; elle ne l'est pas pour un objectif prospectif.

### `dateTrunc=year` par défaut

Les objectifs sont typiquement annuels. Le défaut `year` reflète l'usage réel et évite d'exposer des buckets vides sur des mailles plus fines. Le client peut passer `dateTrunc=month` pour des objectifs infra-annuels.

### Bucketisation déléguée à PostgreSQL

La troncature et le dédoublonnage sont faits dans `getObjectifsTronquesPourIndividus.sql` via `date_trunc`. L'algorithme JS reçoit des séries déjà propres — un point max par individu par bucket.

### Loaders DB partagés

`loadSousArbre` et `loadFonctionsAgregation` sont partagés avec le calcul des valeurs dérivées (`loadIndicateurIndividuContext.ts`). La topologie et les fonctions d'agrégation ne sont chargées qu'une fois par requête, quelle que soit la feature appelante.

### Pas de filtre dateDebut / dateFin

Contrairement aux valeurs, l'endpoint objectifs n'expose pas encore de fenêtre temporelle. Tout l'historique d'objectifs est retourné. À ajouter si le volume devient un problème.

## Hors scope

- Blocage de la saisie sur un parent agrégé (endpoints `upsert` / `delete` inchangés)
- Filtres `dateDebut` / `dateFin`
- Source `manquante` dans les contributions (non pertinent en sémantique stricte)
- Support communes (~36k feuilles)
