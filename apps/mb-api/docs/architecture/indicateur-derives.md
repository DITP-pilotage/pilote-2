# Séries de valeurs dérivées

Date : 2026-05-21
Statut : implémenté

## Contexte métier

### Le modèle

- **Indicateur** — une métrique suivie dans le temps (ex. *nombre d'arbres plantés*, *taux d'équipement fibre*).
- **Référentiel** — une dimension d'analyse : une liste d'entités du même type (ex. *Départements*, *Régions*, *Ministères*). Un indicateur déclare sur quels référentiels il se suit, via le lien `IndicateurReferentiel` qui porte aussi sa `fonctionAgregation` (`SUM` ou `NONE`).
- **Individu** — une entité d'un référentiel (ex. *Bouches-du-Rhône* dans le référentiel *Départements*).
- **Relation** — lien parent/enfant entre individus, souvent entre référentiels (ex. *PACA* → *Bouches-du-Rhône*). Forme une hiérarchie typique *France → Régions → Départements*.
- **Valeur d'avancement** — une saisie d'un agent : `(indicateur, individu, date) → valeur`. La donnée brute du système.

### Saisies vs valeurs dérivées

Toute valeur n'est pas saisie. Selon l'indicateur, les agents peuvent saisir à différentes mailles — départementale, régionale, etc. — et les niveaux supérieurs (typiquement France) doivent être **reconstruits** par agrégation des enfants.

Un individu est donc soit :

- **feuille** pour cet indicateur — ses valeurs sont les saisies directes,
- **agrégé** — ses valeurs sont calculées à partir de ses enfants directs, eux-mêmes feuilles ou agrégés (récursivement).

Le statut feuille/agrégé n'est pas une propriété intrinsèque de l'individu : il dépend de l'indicateur. La règle est unique : c'est la `fonctionAgregation` portée par le lien `IndicateurReferentiel` du référentiel de l'individu qui détermine son statut (cf. `isIndividuAgrege`). `NONE` → feuille ; `SUM` (ou autre fonction à venir) → agrégé.

### Enjeux

1. **Reconstruire sans dupliquer la donnée** — pas de table dénormalisée de valeurs agrégées. Les dérivées sont recalculées à la lecture à partir des saisies feuilles. Source unique de vérité, pas de désynchronisation possible.
2. **Affichage au plus tôt** — un dashboard région ne doit pas attendre que les 100 départements aient saisi pour afficher quelque chose. Dès qu'un enfant a une valeur, on émet un point — quitte à exposer une couverture partielle, visible explicitement dans la réponse.
3. **Évolution dans le temps, pas snapshot** — afficher la trajectoire d'un indicateur agrégé, pas seulement sa dernière valeur. Le calcul doit reconstruire toute la série, pas juste l'état courant.
4. **Cohérence API entre feuilles et agrégés** — du point de vue du client (webapp), lire la série d'un département ou de la France doit se faire de la même façon, avec le même endpoint et la même forme de réponse (au discriminant `type` près).

## Objet

Exposer, pour un indicateur donné, la **série temporelle** de valeurs d'un individu — qu'il soit feuille (saisies directes) ou agrégé (valeurs reconstruites par agrégation hiérarchique de ses descendants). Tout passe par le même endpoint `GET /indicateurs/:id/valeurs` : un seul appel pour lire l'évolution dans le temps, quel que soit le niveau de l'individu dans la hiérarchie.

## Architecture en couches

```
HTTP route  ─►  use case          ─►  functional core      ◄──  TypedSQL
/valeurs        listValeurs…ts        resolveSerieDerivee       getValeursTronquees…sql
                (orchestration I/O)   (pur, mémoïsé)            (bulk, par bucket)
```

Trois responsabilités séparées :

- **Use case** (`queries/listValeursForIndicateur.ts`) — orchestration des I/O Prisma : permissions, chargement de l'arbre, des liens indicateur↔référentiel, et des saisies tronquées. Aucun calcul métier.
- **Functional core** (`resolveSerieDerivee.ts`) — algorithme pur, sans Prisma. Prend un contexte en mémoire (arbres + séries feuilles + fonctions d'agrégation), retourne des séries. Mémoïsé par `individuId`.
- **TypedSQL** (`prisma/sql/getValeursTronqueesPourIndividus.sql`) — une seule requête bulk qui charge les saisies pré-tronquées et pré-dédoublonnées pour toutes les feuilles concernées.

Le découpage isole le calcul (testable sans DB) du chargement (testable par tests d'intégration).

## Cycle de vie d'une requête

`buildSeries` (`listValeursForIndicateur.ts:49`) déroule trois phases :

1. **Résolution des cibles** — `loadCibles` traduit les `publicId` demandés en `id` internes + `referentielId`.
2. **Chargement bulk en parallèle** :
   - `loadSousArbre` — BFS itératif niveau par niveau sur la table `relation`. Construit `enfantsParParent` (la topologie locale dont l'algo a besoin) et `allNodes` (l'univers des descendants).
   - `loadFonctionsAgregation` — map `referentielId → FonctionAgregation` (`SUM` ou `NONE`) pour l'indicateur courant.
   - Puis `loadSaisiesTronquees` (séquentiel : a besoin de `allNodes`) — une requête `$queryRawTyped` pour toutes les saisies, déjà groupées par bucket.
3. **Calcul** — pour chaque cible, `resolveSerieIndividu` produit une série ; on filtre par `dateDebut`/`dateFin` en sortie, puis on convertit en `ValeurAvancementApiModel`.

Tout le travail DB est concentré au début. Le reste vit en mémoire avec un cache local à la requête.

## Calcul de la série

### Distinction feuille / agrégé

`isIndividuAgrege` (`resolveSerieDerivee.ts:46`) : un individu est agrégé pour cet indicateur s'il a **au moins un enfant direct** *et* que son référentiel est lié à l'indicateur avec une `fonctionAgregation ≠ NONE`. Sinon il est feuille — sa série, ce sont ses saisies.

Conséquence importante : si un individu intermédiaire (ex. région) a des saisies *mais* que l'indicateur est configuré avec `SUM` sur les régions, ses saisies sont **ignorées**. La série exposée est toujours la dérivée. Cela évite l'ambiguïté sémantique d'avoir deux sources de vérité, en attendant le blocage strict de la saisie côté commande.

### Cas feuille

Trivial : on prend la série déjà tronquée chargée depuis SQL et on emballe chaque ligne en `PointInterne` de type `saisie`. Le bucket vient du `date_trunc` Postgres, la `dateOrigine` est conservée pour debug.

### Cas agrégé : combineLatest permissif

Le cœur du système (`computeSerieDerivee`, `resolveSerieDerivee.ts:96`). Pour chaque enfant direct, on récupère récursivement sa série (feuille ou dérivée). On fusionne ensuite ces séries niveau par niveau, en répondant à la question : « à chaque date où *au moins un enfant* a une valeur connue, quelle est la somme des dernières valeurs connues de tous les enfants ? »

Mécanique en deux passes :

1. **Union des buckets** — on collecte l'ensemble des dates distinctes apparaissant dans une série enfant, triées ASC. C'est le squelette temporel du parent.
2. **Sweep avec pointers (carry-forward)** — on parcourt les buckets en ordre croissant. Pour chaque enfant on maintient un pointer qui avance tant que la prochaine valeur de cet enfant a une date ≤ bucket courant. La valeur courante de l'enfant à ce bucket est donc *sa dernière valeur connue* — c'est le carry-forward.

À chaque bucket on émet un point avec :

- la somme des valeurs des enfants présents,
- les `contributions` détaillées par enfant (`source: 'saisie' | 'derivee' | 'manquante'`),
- la `couverture` (`{ nbEnfantsAvecValeur, nbEnfantsTotal }`) propre à ce point.

**Permissif** signifie : on n'attend pas que tous les enfants aient saisi pour commencer la série. Dès qu'un enfant a une valeur, on émet ; les autres apparaissent en `manquante`. La couverture progresse dans le temps à mesure que les saisies arrivent. Un dashboard affiche donc l'info au plus tôt, quitte à montrer une couverture partielle — visible explicitement dans la réponse.

### Mémoïsation

`resolveSerieIndividu` consulte un cache `Map<individuId, Point[]>` local à la requête. Si `/valeurs?individus=FRANCE,REG-PACA` est appelé, la série de `REG-PACA` est calculée une seule fois — la branche du calcul de FRANCE qui la traverse réutilise le résultat caché. La complexité d'un appel multi-cibles reste celle d'une seule passe sur l'arbre.

### Dédoublonnage par bucket (côté SQL)

Si un individu a plusieurs saisies dans le même bucket (ex. deux saisies en janvier avec `dateTrunc=month`), on conserve **la plus récente**. C'est fait au load via `DISTINCT ON (individu_id, date_trunc(...)) ORDER BY ..., date DESC, id DESC` — l'algo voit déjà une série propre à un point par bucket.

### Complexité

Pour un sous-arbre avec `N` buckets distincts au total et `E` enfants par parent :

- Temps : `O(N × E)` par parent agrégé (la passe pointers est amortie). Avec mémoïsation, chaque sous-arbre n'est calculé qu'une fois.
- Mémoire : `O(N × E)` pour stocker les séries intermédiaires + cache.

Ordres de grandeur ciblés : France / 18 régions / ~100 départements, ~60 buckets en mensuel → ~1k entries pour la série France (~100 KB JSON). Le passage à `dateTrunc=day` sur la même hiérarchie monte à ~3 MB — borné mais à surveiller.

## Modèle de réponse

Discriminated union sur `type` pour chaque item :

```ts
type ValeurApiModel =
  | { type: 'saisie';  indicateur; individu; date; valeur }
  | { type: 'derivee'; indicateur; individu; date; valeur
      fonctionAgregation: 'SUM'
      contributions: Array<{ individu; valeur: number|null; date: string|null;
                             source: 'saisie' | 'derivee' | 'manquante' }>
      couverture: { nbEnfantsAvecValeur; nbEnfantsTotal } }
```

Pour un point `derivee`, `date` est la **date du bucket** (post-troncature). La date d'origine de chaque contribution (pré-troncature) reste accessible via `contributions[i].date`. On n'expose **pas** les contributions transitives — le client peut interroger l'enfant agrégé pour drill-down.

Query params côté entrée :

- `individus` — 1..100 publicIds
- `dateDebut` / `dateFin` — fenêtre inclusive, appliquée **après** calcul (pas de troncature de l'historique chargé : voir tradeoffs)
- `dateTrunc` — `day | week | month | quarter | year`, **défaut `month`**

## Choix techniques & tradeoffs

### Pas de CTE récursive Postgres

Le calcul reste en JS. La hiérarchie réelle est peu profonde (3-4 niveaux), le BFS itératif sur `relation` est lisible et débuggable. Le coût d'une CTE récursive ne serait justifié qu'à beaucoup plus grande échelle.

### Functional core pur

`resolveSerieDerivee` ne touche jamais Prisma. Toute la donnée nécessaire (arbre, séries feuilles, fonctions d'agrégation) est passée dans un `ResolveSerieContext`. Tests purs rapides, le use case sert d'adaptateur I/O.

### Carry-forward sans coupe à l'entrée

On charge tout l'historique des saisies des descendants, sans pré-filtrer par `dateDebut`/`dateFin`. Le filtre s'applique en sortie sur les buckets calculés. Cela évite des points fantômes ou des approximations à la borne `dateDebut` (une valeur dont la dernière saisie connue est antérieure à la fenêtre serait sinon perdue). Coût mémoire borné par la volumétrie cible.

### `dateTrunc=month` par défaut

Le défaut limite l'explosion de points pour les indicateurs à saisie quotidienne. Pour les dates exactes, le client passe explicitement `dateTrunc=day`.

### Limite de volumétrie : département max

Profondeur supportée : France → Régions → Départements (~100 feuilles). Le code n'oppose aucun garde-fou à des demandes plus volumineuses (ex. communes, ~36k feuilles) : la requête sera juste lente. À reconsidérer si on observe un cas réel en prod.

### Permissif vs strict

On a choisi la sémantique permissive (émettre dès qu'un enfant a une valeur) plutôt que stricte (attendre la couverture complète). Côté produit : un dashboard doit afficher l'information disponible le plus tôt possible. La `couverture` exposée donne au client toute l'info pour signaler visuellement les zones partielles s'il le souhaite.

## Hors scope

- Blocage de la saisie sur indicateur avec `fonctionAgregation ≠ NONE` (côté commands `upsertValeurAvancement`)
- Autres fonctions d'agrégation (AVG, MIN, MAX, COUNT…) — l'enum reste `SUM | NONE`
- Détection de cycles dans `relation`
- Paramètre `?contributions=false` pour alléger la réponse
- Support communes
