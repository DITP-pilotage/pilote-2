# Valeurs dérivées par agrégation hiérarchique — design

Date : 2026-05-19
Statut : accepté

## Contexte

Actuellement, le modèle `ValeurAvancement` permet de saisir une valeur sur un
couple `(indicateur, individu, date)` où `individu` appartient à un
`Referentiel`. Les individus possèdent déjà une hiérarchie via le modèle
`Relation` (parent ↔ enfant), mais celle-ci n'est pas exploitée côté métier.

Le besoin produit est de pouvoir **calculer la valeur d'un individu parent**
comme agrégation des valeurs de ses enfants pour un même indicateur à une date
donnée. Exemples :

- Valeur d'une région = somme des valeurs de ses départements
- Valeur de la France = somme des valeurs de ses régions
- Cas non-somme : moyenne de France = moyenne des moyennes des régions
  (≠ moyenne des départements directement)

## État de l'existant

- **Hiérarchie individu/individu** matérialisée via `Relation`, non exploitée
  côté métier aujourd'hui
- **Pas de hiérarchie entre référentiels** (référentiels plats)
- **Calculs purs déjà extraits** dans `valeurAvancement/` (`computeMediane`,
  `computeMin/Max`, `computeVariation`, `computeEcartMediane`)
- **Synthèse par individu** (PIL-1456, `listSyntheseIndividus`) : voisin
  fonctionnel le plus proche, sert de template
- Routes en place : `GET/PUT/DELETE /indicateurs/:id/valeurs`,
  `.../individus`, `.../valeurs-remarquables`, `.../synthese-individus`

## Décisions

### D1. Coexistence saisie ↔ dérivée (option D3)

Une valeur saisie et une valeur dérivée **peuvent coexister** sur le même
individu pour le même `(indicateur, date)`. Elles sont exposées distinctement
par l'API. Aucun override automatique :

- La valeur saisie reste celle de référence pour le système (source de vérité
  humaine, ex. chiffre officiel INSEE)
- La valeur dérivée est calculée à partir des enfants directs et exposée
  comme valeur calculée distincte

Cela laisse le consommateur (UI, audit) décider de l'affichage selon le
contexte.

### D2. Agrégation niveau par niveau (option E révisée)

La valeur dérivée d'un parent est calculée en appliquant l'agrégateur sur les
**valeurs de ses enfants directs uniquement** (saisies ou dérivées), pas sur
l'ensemble des descendants à plat.

Rationale : la propriété "somme à plat = somme par niveau" n'est vraie que
pour les agrégateurs associatifs et exhaustifs (SUM, MIN, MAX). Pour la
moyenne ou la médiane, descendre à plat donne un résultat sémantiquement
différent. Pour garantir la cohérence multi-agrégateurs et préparer les
besoins futurs (ex. moyenne nationale = moyenne des moyennes régionales),
on traite chaque niveau indépendamment :

```
valeur_dérivée(parent) = agrégateur( valeur(enfant_i) pour enfant_i ∈ enfants_directs(parent) )
```

où `valeur(enfant_i)` est :
- la valeur saisie si elle existe
- sinon la valeur dérivée calculée récursivement
- sinon absente (et l'enfant est ignoré ou produit un résultat partiel —
  voir Questions ouvertes)

### D3. Exposition des niveaux

L'API doit permettre de consulter la valeur dérivée **à n'importe quel niveau
de la hiérarchie** et exposer la décomposition (les enfants directs ayant
contribué). Ceci permet :

- Drill-down dans l'UI (région → départements contributeurs)
- Audit / traçabilité du calcul
- Détection de couvertures partielles (n enfants sur m ont une valeur)

### D4. Endpoint API dédié (option F1)

On introduit un **nouvel endpoint dédié** pour les valeurs dérivées, sans
modifier les endpoints existants :

```
GET /indicateurs/:id/individus/:individuId/valeur-derivee
```

Pas de paramètre `date` : on prend systématiquement la **dernière valeur
connue** de chaque enfant (cohérent avec `listSyntheseIndividus` et
`listIndividusWithValeurs`). Motivation : la valeur portée par un individu
est sa donnée la plus fraîche (s'il y avait 5 arbres en mai, il y en a
toujours 5 en juin par défaut). Chaque contribution porte donc sa propre
date.

Forme provisoire de la réponse (à affiner) :

```json
{
  "indicateur": "IND-ARBRES",
  "individu": "REG-PACA",
  "agregateur": "SUM",
  "valeurDerivee": 1234.56,
  "contributions": [
    { "individu": "DEPT-84", "valeur": 100.00, "date": "2025-12-01", "source": "saisie" },
    { "individu": "DEPT-13", "valeur": 234.56, "date": "2025-11-01", "source": "derivee" },
    { "individu": "DEPT-06", "valeur": null,   "date": null,         "source": "absente" }
  ],
  "couverture": { "nbEnfantsAvecValeur": 2, "nbEnfantsTotal": 3 }
}
```

Ce choix permet d'itérer sans toucher aux endpoints existants. Une intégration
plus transparente (calcul auto si pas de valeur saisie sur l'endpoint GET
classique) pourra être envisagée plus tard.

### D5. Modélisation de la hiérarchie (option A3)

On garde `Relation` tel quel (graphe individu ↔ individu) et on ajoute
l'**invariant métier** : *tous les enfants directs d'un même parent
appartiennent au même référentiel*. Cet invariant est vérifié à l'upsert
d'une `Relation` (pas via une contrainte schéma).

Rationale : pas de duplication avec `Referentiel`, hiérarchie reste portée
par les individus, mais on s'interdit les configurations incohérentes
(ex. un département parent d'une commune et d'un autre département).

### D6. Calcul à la volée (option B1)

Pas de stockage des valeurs dérivées. Chaque appel à l'endpoint déclenche le
calcul à partir des valeurs saisies et des valeurs dérivées des enfants
directs (récursion en mémoire). Pas de table de cache, pas de matérialisation
Prisma.

Rationale : cohérence garantie sans logique d'invalidation. Volumétrie
réévaluable plus tard via B2 ou B3 si nécessaire.

### D7. Agrégateur SUM hardcodé pour le MVP

Pas de configuration d'agrégateur dans le schéma : **SUM est l'agrégateur
unique du MVP**. Une stratégie configurable (champ sur `Indicateur`, ou
autre) sera introduite plus tard quand le besoin produit sera explicite.

### D8. Couverture partielle exposée

Si un parent a `n` enfants directs et que `k < n` d'entre eux ont une valeur
(saisie ou dérivable), on **calcule quand même** et on expose la couverture
(`k / n`) dans la réponse. Le consommateur (UI) décide quoi en faire (alerte,
masquer, etc.). Aucune imputation automatique (pas de 0 par défaut).

### D9. Saisie autorisée sur un individu non-feuille

Saisir une valeur sur un individu qui a des enfants reste **autorisé**. La
valeur saisie et la valeur dérivée coexistent (cf. D1) — c'est au
consommateur d'arbitrer l'affichage.

### D10. Pas de détection de cycles dans `Relation`

On fait confiance aux données. La création de cycles dans `Relation` n'est
pas empêchée par le code, et la traversée récursive ne détecte pas les
cycles. Si un cycle existe en BD, le comportement est non défini (boucle ou
crash).

Rationale : le risque est jugé faible (peu de mutations sur `Relation`, pas
d'API publique d'édition aujourd'hui). À reconsidérer si une API d'édition de
`Relation` est ajoutée.

## Conséquences

- **Pas de migration de schéma requise** : `Relation` existe déjà, pas de
  nouveau champ
- L'upsert de `Relation` (quand il sera exposé) devra valider l'invariant D5
- Une nouvelle famille de queries doit être introduite pour traverser la
  hiérarchie (enfants directs d'un individu) et résoudre les valeurs par
  niveau
- Le functional core gagne un opérateur d'agrégation `sum` (les autres
  agrégateurs viendront plus tard)
- La traversée récursive n'a pas de garde anti-cycle ; si on observe un
  problème en prod, on ajoutera la détection à ce moment-là

## Plan d'implémentation

### Architecture d'une requête

Objectif : `O(profondeur)` queries, indépendant du nombre d'individus.
Trois étapes orchestrées dans `queries/getValeurDerivee.ts`.

#### Étape A — Charger la structure du sous-arbre (BFS niveau par niveau)

Depuis l'individu cible, on charge les descendants par paliers de
profondeur via `relation.findMany({ where: { parentId: { in: ... } } })`.
On itère tant qu'il reste des enfants. **P queries** (P = profondeur du
sous-arbre, typiquement 3–4 : France → Région → Département → ...).

On collecte au passage `{ id, publicId, parentId }` pour reconstruire
l'arbre côté Node.

#### Étape B — Charger toutes les dernières valeurs en bulk (TypedSQL)

Une seule query récupère la dernière valeur connue par individu pour
l'indicateur, via Postgres `DISTINCT ON`. Implémentée en
[**Prisma TypedSQL**](https://www.prisma.io/typedsql) :

```sql
-- prisma/sql/getDernieresValeursPourIndividus.sql
SELECT DISTINCT ON (individu_id)
  individu_id,
  date,
  valeur
FROM valeur_avancement
WHERE indicateur_id = $1
  AND individu_id = ANY($2)
ORDER BY individu_id, date DESC, id DESC;
```

Génération : `npx prisma generate --sql` produit une fonction typée
importable depuis `@/generated/prisma/sql`. Appel :

```ts
import { getDernieresValeursPourIndividus } from '@/generated/prisma/sql'
const rows = await db().$queryRawTyped(
  getDernieresValeursPourIndividus(indicateurId, individuIds),
)
```

Pourquoi TypedSQL plutôt que `$queryRaw` brut : type-safe (paramètres et
retour), SQL vit dans un `.sql` reviewable, pas de mapping manuel des
colonnes. Préféré à `findMany` + dédoublonnage en mémoire (transfert
inutile de données).

#### Étape C — Calcul en mémoire (functional core, pur)

Une fois en main l'arbre des individus + le map
`individuId → derniereValeur | undefined`, le calcul devient pur :

```ts
// functional core, pas de Prisma
resolveValeurDerivee({
  cibleId,
  enfantsParParent,        // Map<parentId, Individu[]>
  derniereValeurParIndividu, // Map<individuId, { valeur, date }>
}): {
  contributions: ContributionApiModel[]
  valeurDerivee: Decimal | null
  couverture: { nbEnfantsAvecValeur, nbEnfantsTotal }
}
```

Logique récursive : pour chaque enfant direct du cible :

1. Saisie présente → contribution `source: 'saisie'`
2. Sinon a-t-il des enfants ? → résolution récursive → si non-null,
   contribution `source: 'derivee'` (date = max des dates contributives)
3. Sinon → contribution `source: 'absente'`, valeur null

Cohérent avec D1 : pour le calcul du parent, la saisie d'un enfant prime
sur la dérivation de ses propres enfants. La dérivée de cet enfant reste
consultable via l'endpoint appliqué à cet enfant.

### Bilan des queries

| Étape | Nombre de queries |
|---|---|
| Charger l'indicateur (validation) | 1 |
| Charger l'individu cible (validation) | 1 |
| BFS structure du sous-arbre | P (~3–4) |
| Dernières valeurs en bulk (TypedSQL) | 1 |
| **Total** | **~6**, indépendant du nombre d'individus |

### Découpage fichiers

| Fichier | Rôle |
|---|---|
| `prisma/sql/getDernieresValeursPourIndividus.sql` | Étape B, query DISTINCT ON typée |
| `valeurAvancement/computeSum.ts` (+ test) | Agrégateur pur SUM |
| `valeurAvancement/resolveValeurDerivee.ts` (+ test) | Functional core, calcul récursif en mémoire |
| `valeurAvancement/queries/getValeurDerivee.ts` (+ test) | Orchestration étapes A/B/C + ResultAsync |
| `valeurAvancement/routes.ts` | Ajout de la route (fichier existant) |
| `packages/mb-shared/src/valeurAvancement.ts` | Schémas Zod (cf. ci-dessous) |

### Schémas API partagés (mb-shared)

Ajouts dans `packages/mb-shared/src/valeurAvancement.ts` :

```ts
contributionSourceSchema = z.enum(['saisie', 'derivee', 'absente'])

contributionApiModelSchema = z.object({
  individu: individuPublicIdSchema,
  valeur: z.number().nullable(),
  date: dateSchema.nullable(),
  source: contributionSourceSchema,
})

couvertureApiModelSchema = z.object({
  nbEnfantsAvecValeur: z.number().int().nonnegative(),
  nbEnfantsTotal: z.number().int().nonnegative(),
})

valeurDeriveeApiModelSchema = z.object({
  indicateur: indicateurPublicIdSchema,
  individu: individuPublicIdSchema,
  agregateur: z.literal('SUM'),
  valeurDerivee: z.number().nullable(),
  contributions: z.array(contributionApiModelSchema),
  couverture: couvertureApiModelSchema,
})
```

### Tests

Tests purs (functional core) sur `resolveValeurDerivee` : couvrent
l'essentiel de la combinatoire sans DB.

- Cible feuille (pas d'enfants) → `valeurDerivee: null`, couverture 0/0
- 1 niveau, saisies complètes → SUM
- 1 niveau, saisies partielles → SUM partiel + couverture
- 2 niveaux (grand-parent), saisies aux feuilles → dérivée intermédiaire,
  puis dérivée du grand-parent. Contributions du grand-parent = niveau
  intermédiaire (source = derivee)
- 2 niveaux, saisie sur niveau intermédiaire + saisie aux feuilles → la
  saisie intermédiaire prime pour la contribution au grand-parent
- Tous les enfants absents → `valeurDerivee: null`, couverture 0/n

Tests d'intégration (1 scénario par bout du pipeline) :

- Cas nominal grand-parent (France/Régions/Départements) end-to-end
- 404 indicateur inexistant, 404 individu inexistant
- 401 sans authentification

### Hors scope MVP

- Invariant D5 (validation côté code) : aucune route d'upsert `Relation`
  n'existe aujourd'hui, à enforcer le jour où elle sera ajoutée
- Détection de cycles dans `Relation` (D10)
- Cap de profondeur (à ajouter si abus observé en prod)

## Prochaines étapes

1. Implémenter `computeSum` + tests purs
2. Implémenter `resolveValeurDerivee` + tests purs (functional core)
3. Ajouter le `.sql` TypedSQL + valider la génération
4. Implémenter `getValeurDerivee` (orchestration A/B/C)
5. Ajouter la route dans `routes.ts` + tests d'intégration
6. Ajouter les schémas Zod dans `mb-shared`
