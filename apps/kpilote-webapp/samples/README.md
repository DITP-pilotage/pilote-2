# Fichiers d'exemple — Import de valeurs

Jeu de fichiers pour tester **l'import normal** vs le **fallback Albert** depuis la
modale d'import de valeurs (`ImportValeursModal`).

**Indicateur cible : `IND-019` — Émissions de gaz à effet de serre** (saisie sur
départements, référentiels REF-DEPT/REG/NAT). Les individus utilisés sont des
départements réels du seed (`prisma/seedData/geo.ts`).

## Rappel du fonctionnement

- **Import normal** : le fichier a exactement les colonnes `individu`, `date`,
  `valeur`. La colonne `individu` contient un **publicId** (`DEPT-01`, `REG-11`,
  `NAT-FR`). Parsé côté client → aperçu → `PUT /indicateurs/{id}/valeurs:batch`.
- **Fallback Albert** : déclenché quand ces 3 colonnes sont **absentes**
  (`MISSING_COLUMNS`). Les lignes brutes sont envoyées à
  `POST /indicateurs/{id}/valeurs:normaliser` — Albert découvre la structure
  (`long`/`pivot`) puis résout les libellés (noms de départements) vers les publicIds.

## Fichiers

| Fichier                      | Chemin testé                     | Attendu                                                                                                |
| ---------------------------- | -------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `01_import_normal.csv`       | Import normal                    | Aperçu direct, 36 lignes (12 dépts × 3 ans), import batch.                                             |
| `02_import_albert_long.csv`  | Fallback Albert — layout `long`  | Headers `Département/Période/Émissions`, noms de dépts, dates FR mélangées → normalisation puis revue. |
| `03_import_albert_pivot.csv` | Fallback Albert — layout `pivot` | Années en colonnes (`2021/2022/2023`) → normalisation puis revue.                                      |
| `04_import_albert_echec.csv` | Fallback Albert — échec          | Pas de colonne valeur/individu exploitable → `PLAN_ECHEC` (message d'erreur).                          |

> ⚠️ Les fichiers Albert nécessitent `ALBERT_API_KEY` côté `kpilote-api`. Sans
> configuration, le fallback renvoie `ALBERT_NON_CONFIGURE` et l'UI retombe sur le
> message d'erreur de format standard.

_Générés via `scratchpad/gen-samples.mjs`._
