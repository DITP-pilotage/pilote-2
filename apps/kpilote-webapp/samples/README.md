# Fichiers d'exemple — Import de valeurs

Jeu de fichiers pour tester **l'import au format standard** et **l'import assisté par
Albert** depuis la modale d'import de valeurs (`ImportValeursModal`).

**Indicateur cible : `IND-019` — Émissions de gaz à effet de serre** (saisie sur
départements, référentiels REF-DEPT/REG/NAT). Les individus utilisés sont des
départements réels du seed (`prisma/seedData/geo.ts`).

## Rappel du fonctionnement

Les deux parcours finissent sur la même grille (une ligne par valeur), où l'on corrige
un rapprochement, une date ou une valeur avant d'importer par
`PUT /indicateurs/{id}/valeurs:batch`.

- **Format standard** : le fichier a les colonnes `individu`, une colonne par axe
  (en-tête = identifiant public de l'axe), `date`, `valeur`. Son plan de transformation
  se construit dans le navigateur (`buildPlanStandard`), sans Albert.
- **Format libre** : dès qu'une de ces colonnes manque, le tableau lu est envoyé à
  `POST /indicateurs/{id}/valeurs:plan-import`. Albert décrit la structure (valeurs en
  lignes ou dates en colonnes) puis rapproche les libellés des individus et des
  modalités ; la modale affiche ses étapes, puis la grille.

## Fichiers

| Fichier                            | Chemin testé                               | Attendu                                                                                                                                                           |
| ---------------------------------- | ------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `01_import_normal.csv`             | Format standard                            | Grille directe, 36 lignes (12 dépts × 3 ans), import batch.                                                                                                       |
| `02_import_albert_long.csv`        | Format libre, valeurs en lignes            | Headers `Département/Période/Émissions`, noms de dépts, dates FR mélangées → étapes d'Albert puis grille.                                                         |
| `03_import_albert_pivot.csv`       | Format libre, dates en colonnes            | Années en colonnes (`2021/2022/2023`) → étapes d'Albert puis grille.                                                                                              |
| `04_import_albert_echec.csv`       | Format libre, échec                        | Pas de colonne valeur/individu exploitable → `ECHEC` (explication affichée).                                                                                      |
| `05_import_albert_axes.csv`        | Format libre, deux axes, dates en colonnes | Indicateur `IND-103` : abréviations d'opérateurs et de types de fraude, un libellé inconnu (`MVNO`) et une valeur `n.d.` à corriger dans la grille.               |
| `06_import_standard_axes.csv`      | Format standard avec axes                  | Indicateur `IND-103` : grille directe, une modalité inconnue, une modalité non feuille et une valeur non numérique à corriger.                                    |
| `07_import_albert_lignes_axes.csv` | Format libre, deux axes, valeurs en lignes | Indicateur `IND-103` : dates écrites de plusieurs façons, un territoire sans tirets, une valeur en toutes lettres à corriger. Pas encore joué dans le navigateur. |
| `08_import_albert_type_valeur.csv` | Format libre avec type de valeur           | Indicateur `IND-103` : seules les lignes `va` sont gardées, les `vi` et `vc` sont écartées. Pas encore joué dans le navigateur.                                   |

> ⚠️ Les fichiers Albert nécessitent `ALBERT_API_KEY` côté `kpilote-api`. Sans
> configuration, l'appel échoue et la modale repropose le dépôt avec un message d'erreur.

Les fichiers `05` à `08` visent `IND-103` (axes Opérateur et Type de fraude) ; les autres visent `IND-019`.
