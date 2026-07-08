# Délai de mise à disposition d'un indicateur — design

**Date :** 2026-07-08
**Statut :** validé, prêt pour plan d'implémentation

## Contexte

Un indicateur porte une **période de mise à jour** (`periodeMiseAJour` : enum
`QUOTIDIENNE`…`ANNUELLE` + `AUCUNE`, avec un `jourMiseAJour` 1–31 optionnel).
Aujourd'hui ces deux champs sont **purement informatifs** : ils sont affichés
dans l'onglet Métadonnées mais n'entrent dans aucun calcul.

Le besoin métier : anticiper **quand la prochaine valeur sera réellement
disponible**. Exemple « données fiscales » :

- dernière valeur connue : décembre 2023 ;
- période de mise à jour : annuelle → prochaine valeur théorique : décembre 2024 ;
- mais les données 2024 ne sont exploitables qu'après un délai de traitement
  (ex. un semestre) → **date de mise à disposition ≈ juin 2025**.

Si ce délai était annuel, la mise à disposition tomberait en décembre 2025.

On introduit donc une **nouvelle métadonnée « délai de mise à disposition »**
et on affiche **deux dates dérivées** dans l'onglet Métadonnées :

1. **Date de la prochaine valeur** = dernière valeur connue + période de mise à jour ;
2. **Date de mise à disposition** = prochaine valeur + délai de mise à disposition.

## Principes de conception

- **L'API est la source de vérité pour les dates dérivées.** La « dernière
  valeur connue » nécessite une lecture des `ValeurAvancement` (que seule l'API
  fait) ; on centralise donc tout le calcul côté API et on expose les dates déjà
  calculées. La webapp est du pur affichage. Cohérent avec le principe « API
  agnostique de l'UI » : ces dates sont de la donnée dérivée du domaine, pas un
  défaut d'affichage.
- **Arithmétique de dates dans un helper pur, testé côté `mb-api`.** Une seule
  fonction, sans I/O, couverte par une table de cas (débordements de mois,
  année bissextile, chaque période, chaque unité de délai).
- **Changement minimal sur l'existant.** `periodeMiseAJour` et `jourMiseAJour`
  restent inchangés. On a explicitement décidé de **ne pas** toucher au modèle de
  la période ni de supprimer `jourMiseAJour` (qui reste informatif, ignoré du
  calcul). Les nouveaux champs sont nullable → aucune migration de données.

## Décisions actées (brainstorming)

| Sujet | Décision |
|---|---|
| Source de la « dernière valeur » | MAX des `ValeurAvancement.date` de l'indicateur, **tous individus confondus** |
| Modèle du délai | Couple `{ nombre: int≥1, unité }`, unité ∈ `{ JOURS, SEMAINES, MOIS, ANNEES }` |
| `periodeMiseAJour` / `jourMiseAJour` | Conservés tels quels ; `jourMiseAJour` reste informatif, non utilisé dans le calcul |
| Affichage | Granularité **mois-année** (« décembre 2024 ») ; « — » si incalculable |
| Lieu du calcul | **API** calcule et expose les dates dérivées |
| `BIMENSUELLE` | Mappé à **+15 jours** (pragmatique ; concept peu pertinent pour cette cadence rapide) |

## Modèle de données (Prisma)

`model Indicateur` — deux nouveaux champs nullable :

```prisma
delaiMiseADispositionNombre  Int?         @map("delai_mad_nombre")
delaiMiseADispositionUnite   UniteDuree?  @map("delai_mad_unite")
```

Nouvel enum :

```prisma
enum UniteDuree {
  JOURS
  SEMAINES
  MOIS
  ANNEES

  @@map("unite_duree_enum")
}
```

Règle applicative : les deux champs vont **ensemble** — soit les deux
renseignés, soit les deux `null`. Un `nombre` sans `unité` (ou l'inverse) est
rejeté à la validation. Pas de contrainte SQL dédiée : la cohérence est garantie
par le schéma Zod du body et par le mapping form (chaîne vide → les deux `null`).

## Schémas partagés (`kpilote-shared`)

- `uniteDureeSchema` : `z.enum(['JOURS', 'SEMAINES', 'MOIS', 'ANNEES'])`, avec
  un `UNITE_DUREE_LABELS` pour l'affichage (« jour(s) », « mois »…).
- `delaiMiseADispositionSchema` : `{ nombre: z.int().min(1), unite: uniteDureeSchema }`
  ou `null`.
- **Écriture** : ajout du délai à `indicateurMetadonneesSchema` (éditable via le
  body upsert, même sémantique PATCH-like que les autres métadonnées : clé
  absente = ne pas toucher, `null` = effacer).
- **Lecture** : ajout à `indicateurApiModelSchema` de **trois dates dérivées,
  lecture seule, nullable** — chaînes ISO `YYYY-MM-DD` :
  - `dateDerniereValeur`
  - `dateProchaineValeur`
  - `dateMiseADisposition`

  L'API renvoie la date complète (le jour = celui de la dernière valeur, propagé
  par l'arithmétique) ; la webapp la formate en mois-année à l'affichage.

## Calcul (helper pur, `mb-api`)

Table période → intervalle :

| Période | Intervalle |
|---|---|
| `QUOTIDIENNE` | +1 jour |
| `HEBDOMADAIRE` | +7 jours |
| `BIMENSUELLE` | +15 jours |
| `MENSUELLE` | +1 mois |
| `TRIMESTRIELLE` | +3 mois |
| `SEMESTRIELLE` | +6 mois |
| `ANNUELLE` | +1 an |
| `AUCUNE` / `null` | pas de calcul → `null` |

Logique :

- `dateDerniereValeur` = MAX des `ValeurAvancement.date` de l'indicateur
  (tous individus). `null` si aucune valeur.
- `dateProchaineValeur` = `dateDerniereValeur + intervalle(période)`. C'est la
  **prochaine occurrence théorique après la dernière connue**, même si elle est
  déjà dans le passé (pas de « rattrapage » vers aujourd'hui : dernière
  déc. 2023 + annuelle = déc. 2024, point). `null` si `dateDerniereValeur` est
  `null` ou si la période est `AUCUNE`/absente.
- `dateMiseADisposition` = `dateProchaineValeur + délai`. `null` si
  `dateProchaineValeur` est `null` **ou** si le délai est absent.

Arithmétique calendaire : ajout mois/année avec **clamp du jour** au dernier
jour du mois cible en cas de débordement (31 janv. + 1 mois → 28/29 févr.).
Ajout jours/semaines : arithmétique calendaire simple.

## Formulaire admin (`kpilote-admin`)

Dans la section « Métadonnées » du `IndicateurForm`, un champ **délai de mise à
disposition** : un **input nombre** (entier ≥ 1) + un **select unité**
(JOURS/SEMAINES/MOIS/ANNEES). Vide = pas de délai (les deux champs repassent à
`null` via `toUpsertBody`). Les trois dates dérivées ne sont **pas** éditables.

## Affichage webapp (`IndicateurMetadonnees.tsx`)

Nouvelles lignes dans la `DescriptionList` :

- **« Délai de mise à disposition »** : le délai en clair (« 6 mois »), « — » si absent.
- **« Date de la prochaine valeur »** : `dateProchaineValeur` en mois-année, « — » si `null`.
- **« Date de mise à disposition »** : `dateMiseADisposition` en mois-année, « — » si `null`.

Format mois-année (« décembre 2024 ») via un helper de formatage (dérivé de
`formatDateTimeFr` existant, ou nouveau `formatMoisAnneeFr`).

## Tests & cas limites

- **Helper pur (unitaire)** : chaque période → bon intervalle ; débordements de
  mois (31 → fin de mois court) ; année bissextile ; chaque unité de délai ;
  chaînage prochaineValeur → miseADisposition ; propagation des `null`.
- **Intégration (query détail)** : aucune valeur → dates `null` ;
  période `AUCUNE`/`null` → prochaineValeur & miseADisposition `null` ; délai
  absent → miseADisposition `null` ; cas nominal « données fiscales ».
- **Upsert** : le délai `{nombre, unité}` est persisté ; `null` l'efface ;
  `nombre` sans `unité` rejeté.

## Hors périmètre

- Pas de refonte de `periodeMiseAJour` / `jourMiseAJour`.
- Pas de « rattrapage » de la prochaine valeur vers une occurrence future.
- Pas d'écriture des valeurs ni de recalcul déclenché ailleurs qu'au GET détail.
