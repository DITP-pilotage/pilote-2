# Séries de valeurs dérivées — design

Date : 2026-05-21
Statut : accepté

## Contexte

Le design [`valeurs-derivees-design.md`](./valeurs-derivees-design.md) (2026-05-19) a introduit un endpoint dédié `GET /indicateurs/:id/individus/:individuId/valeur-derivee` qui calcule **la dernière valeur dérivée** d'un individu par agrégation hiérarchique de ses enfants. Ce design enrichit ce socle pour exposer **la série temporelle complète** des valeurs dérivées (et plus uniquement la dernière), et fusionne le résultat dans l'endpoint `/valeurs` existant.

Besoin produit : afficher l'évolution dans le temps d'un indicateur sur un individu agrégé (région, France) — pas seulement sa valeur courante. La webapp consomme déjà la série pour les individus feuilles via `/valeurs` ; on veut la même chose pour les individus dérivés, dans le même endpoint, sans dédoublement client.
Besoin produit : afficher l'évolution dans le temps d'un indicateur sur un D11individu agrégé (région, France) — pas seulement sa valeur courante. La webapp consomme déjà la série pour les individus feuilles via `/valeurs` ; on veut la même chose pour les individus dérivés, dans le même endpoint, sans dédoublement client.

## État de l'existant

- `GET /indicateurs/:id/valeurs?individus=...&dateDebut=...&dateFin=...` renvoie les **saisies** sous la forme `{ items: [{ indicateur, individu, date, valeur }, …] }`, triées par `individuId ASC, date ASC` (cf. `apps/mb-api/src/valeurAvancement/queries/listValeursForIndicateur.ts`)
- `GET /indicateurs/:id/individus/:individuId/valeur-derivee` renvoie la **dernière** valeur dérivée + ses contributions directes + couverture (cf. `apps/mb-api/src/valeurAvancement/queries/getValeurDerivee.ts`)
- L'algo `resolveValeurDerivee` (functional core, pur) prend la dernière saisie par individu et agrège niveau par niveau (saisie prime, sinon dérivée des enfants)
- Fonction d'agrégation `SUM | NONE` portée par le lien `IndicateurReferentiel` (commit `b7cfd14c3`)
- Hiérarchie `Relation(parentId, childId)` traversée en BFS itératif via `loadIndividuTree()`
- TypedSQL `getDernieresValeursPourIndividus.sql` charge les dernières valeurs en bulk (1 requête)

## Décisions

### D1. Suppression de `/valeur-derivee`, fusion dans `/valeurs`

Le endpoint `GET /indicateurs/:id/individus/:individuId/valeur-derivee` est **supprimé**. La série dérivée d'un individu est désormais exposée par `GET /indicateurs/:id/valeurs`, exactement comme la série saisie d'un individu feuille.

L'API client n'a qu'un seul endpoint à consommer pour lire l'évolution d'un indicateur sur un individu, quel que soit son niveau dans la hiérarchie.

Breaking change assumé : pas de phase de coexistence ni d'alias. À documenter dans le changelog de release.

### D2. Réponse enrichie : `type` + métadonnées par point

Chaque item de la réponse `/valeurs` porte désormais :

- `type: 'saisie' | 'derivee'` — nature du point
- Si `type = 'derivee'` :
  - `fonctionAgregation` — fonction utilisée (ex. `SUM`)
  - `contributions[]` — décomposition par enfant direct au moment du point
  - `couverture` — `{ nbEnfantsAvecValeur, nbEnfantsTotal }` propre à ce point

Pour un individu feuille (ou non-agrégé), tous les items ont `type: 'saisie'`. Pour un individu agrégé, tous les items ont `type: 'derivee'` (cf. D5).

### D3. Sémantique combineLatest "permissive"

On émet un point dérivé **dès qu'au moins un enfant a une valeur connue** au bucket considéré (et pas seulement quand tous les enfants ont émis — sémantique rxjs strict).

Conséquences :
- Le premier point de la série dérivée d'un parent correspond au premier bucket où **un** enfant a saisi une valeur. À ce point, la couverture sera `1/n` et la `valeurDerivee` = la valeur de cet unique enfant.
- La couverture progresse dans le temps à mesure que les enfants saisissent leurs premières valeurs.
- Les enfants sans valeur connue au bucket courant apparaissent dans `contributions` avec `source: 'manquante'`, `valeur: null`, `date: null`. La SUM se fait uniquement sur les enfants présents.

Rationale produit : un dashboard affiche au plus tôt l'info disponible. Cacher les premiers points jusqu'à couverture complète bloquerait l'affichage longtemps pour les indicateurs à saisie progressive.

### D4. Paramètre `dateTrunc`

Nouveau query param `dateTrunc` sur `/valeurs`, valeurs autorisées : `day | week | month | quarter | year`. **Par défaut `month`** — limite l'explosion de points en réponse pour les indicateurs saisis à fréquence quotidienne. Pour récupérer les dates exactes sans troncature, passer explicitement `dateTrunc=day`.

Sémantique :
- `week` = lundi ISO 8601 (cohérent avec `date_trunc('week', …)` PostgreSQL)
- `month` = 1er du mois
- `quarter` = 1er janvier, 1er avril, 1er juillet, 1er octobre
- `year` = 1er janvier

S'applique aussi bien aux saisies (séries feuilles) qu'aux dérivées : la troncature uniformise les buckets entre individus.

### D5. Collision dans un bucket : on garde la plus récente

Si un individu a plusieurs saisies dans le même bucket post-troncature (ex. 5 janvier et 18 janvier avec `dateTrunc=month`), on conserve **la plus récente** (18 janvier) comme valeur du bucket pour cet individu.

Implémentation : dédoublonnage par bucket lors du chargement de la série (Postgres `DISTINCT ON (bucket) ... ORDER BY bucket, date DESC, id DESC`), cohérent avec `getDernieresValeursPourIndividus.sql` existant.

### D6. Saisie ignorée sur indicateur agrégé

Si l'indicateur a une `fonctionAgregation` définie (≠ `NONE`) sur le référentiel de l'individu cible, les saisies éventuelles sur cet individu sont **ignorées** lors du calcul. La série exposée est **toujours dérivée**.

Rupture explicite avec la règle "saisie prime" du design 2026-05-19 (D1 du doc précédent). Motivation : on prépare le blocage strict des saisies sur indicateurs agrégés (hors scope de ce ticket, à faire dans une PR ultérieure). En attendant, on évite l'ambiguïté sémantique en favorisant la dérivation.

### D7. Date du point dérivé = date du bucket

La `date` retournée pour un point dérivé est **la date du bucket** (post-troncature), pas la date d'une saisie d'origine.

La date d'origine d'une contribution est exposée séparément dans `contributions[i].date` à des fins de debug / drill-down.

### D8. Forme des contributions

Chaque contribution porte :
- `individu` (publicId de l'enfant direct)
- `valeur` — **dernière valeur connue** de cet enfant **≤** date du bucket courant (carry-forward), ou `null` si jamais saisi
- `date` — date d'origine de la valeur portée (avant troncature) pour debug
- `source: 'saisie' | 'derivee' | 'manquante'` — `'saisie'` si l'enfant est une feuille avec saisie ; `'derivee'` si l'enfant est lui-même agrégé ; `'manquante'` si aucune valeur connue ≤ bucket

On n'expose **pas** les contributions transitives (les enfants des enfants). Le client peut faire un appel ciblé sur l'enfant agrégé pour drill-down.

### D9. Carry-forward sans coupe

On charge **tout l'historique** des saisies des feuilles descendantes, sans filtrer par `dateDebut`/`dateFin` au load.

`dateDebut`/`dateFin` filtrent en sortie après calcul : on conserve uniquement les points dont la date de bucket est dans la fenêtre. Pas de "carry-forward au-dessus de la fenêtre" : si aucun bucket n'existe avant `dateDebut`, la série commence au premier bucket ≥ `dateDebut`.

Rationale : éviter les approximations / valeurs fantômes à `dateDebut`. Le coût mémoire est borné (cf. D11).

### D10. Multi-individus : calcul indépendant

`/valeurs?individus=A,B,C` calcule la série de chaque individu **indépendamment**. Pas de combinaison croisée entre individus de la requête.

Les saisies des enfants peuvent être partagées entre plusieurs individus demandés (ex. `individus=FRANCE,REG-PACA` chargera DEPT-84 via REG-PACA et indirectement via FRANCE) — on dédoublonne le chargement DB mais on calcule deux séries séparées.

### D11. Limite de volumétrie : département max

Profondeur testée et supportée : **France → Régions → Départements** (~100 feuilles, max ~3 niveaux). Pas de support officiel pour communes (~36k feuilles). À documenter dans la description OpenAPI.

On **accepte mollement** les demandes au-delà : pas de garde-fou applicatif, pas de rejet de la requête, pas de cap de profondeur ou de nombre de feuilles. La requête sera juste lente / coûteuse en mémoire si elle dépasse les ordres de grandeur attendus. À reconsidérer le jour où on observerait un abus en prod.

### D12. Récursion multi-niveaux avec mémoïsation

La série dérivée d'un nœud intermédiaire (ex. région) est calculée une fois et **mémoïsée** par `individuId` au sein d'une requête. Si un appel demande `individus=FRANCE,REG-PACA`, la série de `REG-PACA` n'est calculée qu'une fois.

Implémentation : cache `Map<individuId, Point[]>` local au use case, alimenté en DFS post-ordre.

### D13. Couverture par point

La `couverture` exposée dans chaque point dérivé compte les enfants directs ayant **une valeur connue ≤ bucket** (saisie ou dérivée) :

```
couverture = {
  nbEnfantsAvecValeur: count(contributions[i].source !== 'manquante'),
  nbEnfantsTotal: contributions.length,
}
```

Évolue dans le temps. Le client peut détecter visuellement les zones de la série où la couverture est partielle.

## Algorithme

### Pseudocode

```
fonction sérieDérivée(individuId, dateTrunc, cache):
  si cache.contient(individuId): retourne cache.get(individuId)

  enfants = relations.enfantsDirects(individuId)

  si enfants.vide():
    # Cas feuille : on retourne la série de saisies tronquée + dédoublonnée
    série = saisies(individuId, dateTrunc)  # via SQL avec DISTINCT ON (bucket)
    cache.set(individuId, série)
    retourne série

  # Cas nœud intermédiaire : calcul récursif des enfants puis combineLatest
  sériesEnfants = []
  pour chaque enfant ∈ enfants:
    sériesEnfants.push((enfant, sérieDérivée(enfant.id, dateTrunc, cache)))

  buckets = union(toutes les dates des sériesEnfants)  # triés ASC
  pointers = Map<enfantId, indexCourantDansSaSérie> initialisée à 0
  points = []

  pour chaque bucket ∈ buckets ordonnés ASC:
    contributions = []
    valeursPourSomme = []
    pour chaque (enfant, sérieEnfant) ∈ sériesEnfants:
      # Avancer le pointer tant que sérieEnfant[ptr+1].date <= bucket
      avancer pointers[enfant.id]
      derniereValeurConnue = sérieEnfant[pointers[enfant.id]]  # peut être null si pointer < 0

      si derniereValeurConnue existe et derniereValeurConnue.date <= bucket:
        contributions.push({
          individu: enfant.publicId,
          valeur: derniereValeurConnue.valeur,
          date: derniereValeurConnue.dateOrigine,
          source: enfant.estFeuille ? 'saisie' : 'derivee',
        })
        valeursPourSomme.push(derniereValeurConnue.valeur)
      sinon:
        contributions.push({
          individu: enfant.publicId,
          valeur: null,
          date: null,
          source: 'manquante',
        })

    points.push({
      date: bucket,
      valeur: computeSum(valeursPourSomme),
      type: 'derivee',
      fonctionAgregation: 'SUM',
      contributions,
      couverture: {
        nbEnfantsAvecValeur: valeursPourSomme.length,
        nbEnfantsTotal: contributions.length,
      },
    })

  cache.set(individuId, points)
  retourne points
```

### Complexité

Pour un individu cible avec :
- `N` = nombre total de buckets distincts dans son sous-arbre après troncature
- `E` = nombre d'enfants directs
- `D` = profondeur du sous-arbre

Complexité temps : **O(N × E × D)** dans le pire cas (DFS post-ordre + combineLatest à chaque niveau). Avec mémoïsation par individu, chaque sous-arbre n'est calculé qu'une fois.

Complexité mémoire : **O(N × E)** pour stocker les séries intermédiaires + cache.

Ordres de grandeur attendus :
- France / 18 régions / ~100 départements
- 5 ans × 12 mois = 60 buckets avec `dateTrunc=month`
- Série France = 60 points × 18 contributions = 1080 entries → ~100 KB JSON. OK.
- Série France avec `dateTrunc=day` et saisies quotidiennes = 1825 buckets × 18 contributions ≈ 33k entries → ~3 MB JSON. À surveiller.

Pas de CTE récursive Postgres : on garde le calcul en JS pour la lisibilité. La table `relation` reste un BFS itératif par niveau (déjà en place).

### Chargement DB

Une seule requête bulk pour les saisies tronquées :

```sql
-- prisma/sql/getValeursTronqueesPourIndividus.sql
SELECT DISTINCT ON (individu_id, date_trunc($3, date::date))
  individu_id  AS "individuId",
  date_trunc($3, date::date)::date AS bucket,
  date         AS "dateOrigine",
  valeur
FROM valeur_avancement
WHERE indicateur_id = $1
  AND individu_id = ANY($2)
ORDER BY individu_id, date_trunc($3, date::date), date DESC, id DESC;
```

Le `$3` est passé comme `text` (`'day' | 'week' | 'month' | 'quarter' | 'year'`).

Note : `date` est typée `String` dans Prisma mais représente un `YYYY-MM-DD` ; cast `::date` nécessaire pour `date_trunc`.

## Modèle API

### Query params (`listValeursForIndicateurQuerySchema`)

```ts
{
  individus: string[],        // 1..100 publicIds (existant)
  dateDebut?: string,         // YYYY-MM-DD inclusif (existant)
  dateFin?: string,           // YYYY-MM-DD inclusif (existant)
  dateTrunc?: 'day' | 'week' | 'month' | 'quarter' | 'year',  // nouveau, défaut 'day'
}
```

### Schéma de réponse (`valeurAvancementListApiModelSchema`)

```ts
type ValeurApiModel =
  | {
      indicateur: string
      individu: string
      date: string                  // YYYY-MM-DD (bucket post-troncature)
      valeur: number
      type: 'saisie'
    }
  | {
      indicateur: string
      individu: string
      date: string                  // YYYY-MM-DD (bucket)
      valeur: number
      type: 'derivee'
      fonctionAgregation: 'SUM'     // (énum FonctionAgregation, NONE exclu par construction)
      contributions: Array<{
        individu: string
        valeur: number | null
        date: string | null         // date d'origine (avant troncature)
        source: 'saisie' | 'derivee' | 'manquante'
      }>
      couverture: {
        nbEnfantsAvecValeur: number
        nbEnfantsTotal: number
      }
    }

type ValeurAvancementListApiModel = {
  items: ValeurApiModel[]
}
```

Discriminated union sur `type` côté Zod (`z.discriminatedUnion('type', […])`).

### Exemple de réponse

```json
{
  "items": [
    {
      "indicateur": "IND-ARBRES",
      "individu": "REG-PACA",
      "date": "2025-01-01",
      "valeur": 100.0,
      "type": "derivee",
      "fonctionAgregation": "SUM",
      "contributions": [
        { "individu": "DEPT-13", "valeur": 100.0, "date": "2025-01-18", "source": "saisie" },
        { "individu": "DEPT-84", "valeur": null,  "date": null,         "source": "manquante" }
      ],
      "couverture": { "nbEnfantsAvecValeur": 1, "nbEnfantsTotal": 2 }
    },
    {
      "indicateur": "IND-ARBRES",
      "individu": "REG-PACA",
      "date": "2025-02-01",
      "valeur": 334.56,
      "type": "derivee",
      "fonctionAgregation": "SUM",
      "contributions": [
        { "individu": "DEPT-13", "valeur": 100.0,  "date": "2025-01-18", "source": "saisie" },
        { "individu": "DEPT-84", "valeur": 234.56, "date": "2025-02-05", "source": "saisie" }
      ],
      "couverture": { "nbEnfantsAvecValeur": 2, "nbEnfantsTotal": 2 }
    }
  ]
}
```

## Conséquences

- **Breaking change** sur `/valeurs` : ajout du discriminant `type` (cassant si le client itère sans tester `type`)
- **Suppression** de la route `/indicateurs/:id/individus/:individuId/valeur-derivee` et de tous ses artefacts associés (use case `getValeurDerivee`, schémas `ValeurDeriveeApiModel`, tests)
- **Refactor** de `resolveValeurDerivee` : passage d'un résultat scalaire à une série temporelle, mémoïsation par individu
- **Renommage** de `getDernieresValeursPourIndividus.sql` → `getValeursTronqueesPourIndividus.sql` (ou ajout d'un nouveau, ancien à supprimer si plus de référence)
- Le functional core reste pur (pas de Prisma dans `resolveValeurDerivee`)

## Plan d'implémentation

### Étapes

1. **Étendre `mb-shared`** : ajouter `dateTrunc` au query schema, discriminated union sur `type`, supprimer les schémas `ValeurDeriveeApiModel` / `ContributionApiModel` / `CouvertureApiModel` au profit des nouveaux schémas inline (ou les réutiliser pour le sous-objet `contributions`).
2. **Nouveau TypedSQL** `prisma/sql/getValeursTronqueesPourIndividus.sql` (paramètre `date_trunc` dynamique).
3. **Refactor functional core** : `resolveValeurDerivee` devient `resolveSerieDerivee` qui renvoie `Point[]`. Mémoïsation par `individuId` via `Map`.
4. **Refactor use case** `listValeursForIndicateur` :
   - Pour chaque individu demandé : déterminer s'il est feuille ou agrégé (via `Relation` + `IndicateurReferentiel.fonctionAgregation`)
   - Si feuille (ou `fonctionAgregation = NONE`) → série de saisies tronquée
   - Sinon → série dérivée via `resolveSerieDerivee`
   - Charger en bulk toutes les saisies des feuilles descendantes (1 query, dédoublonnage par individu si plusieurs cibles partagent des feuilles)
   - Filtrer par `dateDebut`/`dateFin` en sortie
   - Concaténer + trier par `(individu, date)`
5. **Supprimer** la route `/valeur-derivee` (routes.ts) + `getValeurDerivee.ts` + tests associés.
6. **Mettre à jour les tests d'intégration** `listValeursForIndicateur.test.ts` : cas feuilles, cas dérivés (1/2/3 niveaux), couverture partielle dans le temps, `dateTrunc` (day/month/year), filtres date sur séries dérivées.
7. **Tests purs** sur `resolveSerieDerivee` : combineLatest permissif, carry-forward, mémoïsation.
8. **OpenAPI** : description claire du nouveau comportement, mention de la limite "département max" pour les agrégés.

### Découpage fichiers

| Fichier | Action |
|---|---|
| `packages/mb-shared/src/valeurAvancement.ts` | Étendre query + discriminated union sur `type` |
| `apps/mb-api/prisma/sql/getValeursTronqueesPourIndividus.sql` | Nouveau TypedSQL |
| `apps/mb-api/src/valeurAvancement/resolveSerieDerivee.ts` (+ test) | Functional core (nouveau, remplace `resolveValeurDerivee.ts`) |
| `apps/mb-api/src/valeurAvancement/queries/listValeursForIndicateur.ts` (+ test) | Refactor du use case |
| `apps/mb-api/src/valeurAvancement/queries/getValeurDerivee.ts` (+ test) | **Suppression** |
| `apps/mb-api/src/valeurAvancement/resolveValeurDerivee.ts` (+ test) | **Suppression** |
| `apps/mb-api/src/valeurAvancement/routes.ts` | Suppression de la route `/valeur-derivee`, mise à jour de la route `/valeurs` |
| `apps/mb-api/prisma/sql/getDernieresValeursPourIndividus.sql` | **Suppression** si plus référencée |

### Tests

Tests purs (sans DB) sur `resolveSerieDerivee` :

- Feuille seule (avec / sans saisies)
- 1 niveau, couverture 100% (combineLatest devient SUM par bucket)
- 1 niveau, couverture progressive (premier point avec 1/n, dernier point avec n/n)
- 1 niveau, valeur manquante au milieu de la série (carry-forward)
- 2 niveaux (grand-parent / parent / feuilles) — vérifier la mémoïsation : on n'appelle pas deux fois
- 3 niveaux (France / Régions / Départements)
- Saisie sur nœud intermédiaire ignorée si `fonctionAgregation` définie (D6)
- Collision dans bucket : 2 saisies même mois → la plus récente du mois est retenue
- `dateTrunc` variés sur la même série d'entrée

Tests d'intégration (avec DB) sur `listValeursForIndicateur` :

- Feuille avec saisies + `dateTrunc=month`
- Région avec 2 départements (saisies croisées en couverture partielle puis complète)
- France avec 2 régions × 2 départements end-to-end
- Filtre `dateDebut`/`dateFin` sur série dérivée
- Multi-individus `individus=A,B,C` mix feuille/agrégé
- Indicateur avec `fonctionAgregation = NONE` sur un référentiel : série de saisies, pas d'agrégation, même si des enfants existent
- 401 sans authentification, 404 indicateur inexistant

## Hors scope

- **Blocage de la saisie** sur indicateur avec `fonctionAgregation ≠ NONE` (côté commands `upsertValeurAvancement`) — PR séparée
- **Support communes** (>500 feuilles) — pas de garde-fou ni d'optimisation matérialisée pour le MVP (cf. D11)
- **Détection de cycles** dans `Relation` (déjà hors scope du design précédent)
- **Autres fonctions d'agrégation** que SUM (AVG, MIN, MAX, COUNT…) — l'enum reste `SUM | NONE`
- **Paramètre `?contributions=false`** pour réduire la taille de réponse — pas pour le MVP. Les contributions sont toujours embarquées dans les points dérivés. À reconsidérer si la volumétrie devient problématique en prod.
- **Préservation transitoire de `/valeur-derivee`** — suppression nette, pas de phase de dépréciation (build, pas encore de prod, cf. D1).

## Prochaines étapes

1. Valider ce design (revue Antoine)
2. Implémenter le TypedSQL + tests de la query brute
3. Refactor `resolveSerieDerivee` + tests purs
4. Refactor use case `listValeursForIndicateur` + tests d'intégration
5. Suppression du endpoint `/valeur-derivee` et nettoyage
6. Mise à jour de la description OpenAPI et du changelog
