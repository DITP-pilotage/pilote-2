# kpilote — multifiltre : axes et modalités (design)

Date : 2026-11-12
Tickets : epic PIL-1804, story PIL-1963 (sous-tâches PIL-1979 à PIL-1999)
Plan d'implémentation : `docs/superpowers/plans/2026-11-12-kpilote-multifiltre-axes.md`

Ce document consigne les décisions prises en reprenant le POC « dimensions ». Il doit suffire à un agent qui
n'a pas suivi la discussion : en cas de doute, il fait foi sur le POC.

---

## 1. Contexte

### Le besoin

Aujourd'hui, une valeur d'indicateur est `(indicateur, individu, date) → valeur`. L'individu est en pratique
un territoire (NAT → REG → DEPT, hiérarchie `Relation`). Les utilisateurs veulent découper un indicateur selon
d'autres critères, croisés avec le territoire : par opérateur (Orange, SFR…), par type de fraude (TVA, IR…).

Le contournement actuel crée un indicateur par opérateur, regroupés dans une collection. Il ne permet pas
d'obtenir « le total du 84, tous opérateurs confondus » : une collection fait une moyenne de taux de
progression, elle n'agrège pas les valeurs.

### Le POC

- Branche : `claude/individu-dimension-poc-f01d87` (poussée, tête `4329d3bfc`), PR brouillon
  DITP-pilotage/pilote-2#2636. **Ne pas merger.**
- Documents du POC, sur cette branche :
  - `apps/kpilote-api/docs/architecture/dimensions-poc-brief.md` (le contrat du POC) ;
  - `apps/kpilote-api/docs/architecture/dimensions-design.md` (5 modèles étudiés, challenge, modèle M1‴) ;
  - `apps/kpilote-api/docs/architecture/dimensions-poc-rapport.md` (rapport final, preuves, limites).
- Un commit de seed `2f9ea9d21` (« seed carto-sp », 6 indicateurs Territoire × Opérateur de service public)
  n'existe que dans le worktree local du POC ; il n'est pas poussé.
- Le POC est basé sur `eed13bc10`. `dev` a beaucoup bougé depuis (ex. `loadResolveSerieContext.ts`) :
  on **reprend des idées et des morceaux de code**, on ne rebase pas le POC.

Le POC a prouvé la faisabilité, mais il a fait un choix de modèle que l'on **n'a pas retenu** : faire du
référentiel un « niveau » d'une « dimension », et remplacer `individu_id` par `cellule_id` sur toutes les
tables de faits. Voir §7.

---

## 2. Vocabulaire

Ces termes sont fixés. Ils valent pour le code, la doc et les tickets.

| Terme              | Définition                                                                                                                            | Où il apparaît                                                                                                      |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| **Axe**            | Un découpage défini par l'utilisateur : Opérateur, Type de fraude. Remplace « dimension » du POC, partout, code compris.              | Code, API, admin                                                                                                    |
| **Modalité**       | Une valeur d'un axe : Orange, TVA. Terme statistique (les modalités d'une variable). « Valeur » est déjà pris par `ValeurAvancement`. | Code, API, admin                                                                                                    |
| **Niveau** (d'axe) | Un étage d'un axe imbriqué : Famille → Type de fraude. Un axe plat a un seul niveau. Dans le code : `NiveauAxe`.                      | Code, admin                                                                                                         |
| **Combinaison**    | L'ensemble des modalités qui précisent une valeur, au plus une par axe. La combinaison vide = aucune modalité.                        | Code, base                                                                                                          |
| **Cellule**        | Le point qui porte une valeur : un individu + une combinaison. Concept de domaine, pas de table.                                      | Code                                                                                                                |
| **Marginale**      | Le « Tous » d'un axe, calculé à la lecture, jamais stocké.                                                                            | Code, doc. À l'écran : « Tous » dans les sélecteurs, « Ensemble » / « tous opérateurs confondus » dans les légendes |

Termes à **ne pas** employer :

- « dimension » : remplacé par « axe » (et déjà pris dans l'admin par les dimensions Matomo,
  `routes/_authed/dimensions-matomo.tsx`) ;
- « maille » : trop connoté pilote-ppg, il a un sens précis là-bas ;
- « membre » : employé par le POC pour l'individu, source de confusion ;
- le slogan du POC « l'individu devient une dimension comme une autre » : il est faux dans le modèle retenu.

---

## 3. Décisions

| #   | Décision                                                                                                                                                                                                                                                                                                                               |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| D1  | Les **référentiels, individus et la hiérarchie territoriale** (`Relation`) restent **tels qu'ils sont**. Les axes s'ajoutent à côté. L'individu n'est pas un axe comme les autres.                                                                                                                                                     |
| D2  | **Tout indicateur garde un individu** : l'individu est obligatoire dans chaque cellule.                                                                                                                                                                                                                                                |
| D3  | Les axes sont **dynamiques**, définis par l'utilisateur, stockés en base.                                                                                                                                                                                                                                                              |
| D4  | Les axes peuvent être **imbriqués dès la v1**, sur une profondeur libre (niveaux ordonnés + modalités en arbre).                                                                                                                                                                                                                       |
| D5  | **Seules les valeurs** portent une combinaison. **Objectifs, commentaires et niveaux de confiance restent sur l'individu.**                                                                                                                                                                                                            |
| D6  | Le taux de progression d'un indicateur à axes se calcule sur la **marginale** (tous les axes à « Tous ») divisée par l'objectif de l'individu. Pas de taux pour une modalité.                                                                                                                                                          |
| D7  | **Combinaisons partagées** entre indicateurs, identifiant **uuid**, **clés étrangères** vers les modalités (pas de clé texte), une **ligne « combinaison vide » globale**.                                                                                                                                                             |
| D8  | **Ordre d'agrégation : chemin 1** (arbitrage du point n°1, commentaire de PIL-1963). On combine d'abord les axes au grain territorial le plus fin, puis on remonte la hiérarchie territoriale existante. Entre plusieurs axes : l'ordre de déclaration sur l'indicateur, réglable dans l'admin (proposition du point n°2 de PIL-1963). |
| D9  | On ne **saisit** que sur des modalités **feuilles**. Les niveaux parents et la marginale se calculent.                                                                                                                                                                                                                                 |
| D10 | Fiche indicateur : un sélecteur par axe, **comparaison** (médiane, min, max) et **carte** pour une modalité, graphique « **Décomposer par** ».                                                                                                                                                                                         |
| D11 | **Hors périmètre** : sélecteur de modalité sur les tableaux de bord `/indicateurs` et les collections (donc pas de `nonApplicable`), cloisonnement des droits par modalité, commentaires et confiance par modalité.                                                                                                                    |
| D12 | **Pas de feature flag.** Chaque PR part en prod telle quelle. Tant qu'aucun indicateur n'a d'axe, rien ne change pour l'existant. La prod kpilote ne contient que des données fictives manipulées par l'équipe.                                                                                                                        |
| D13 | Déclaration des axes d'un indicateur par un champ `axes` optionnel de `PUT /indicateurs/{id}` (absent = inchangé). La route dédiée envisagée au départ protégeait le contrat de pilote-ppg, dont la synchronisation a été supprimée (#2668).                                                                                           |
| D14 | **Une fonction par axe et par indicateur** (SUM ou AVG), appliquée à chaque niveau de l'axe puis à « Tous ». Pas de fonction par niveau : les niveaux d'un axe découpent la même population, aucun cas réaliste ne demande de les mélanger. Pas de NONE : on ne saisit que sur des feuilles (D9).                                      |

---

## 4. Modèle de données

```
axe            (id uuid, public_id 'AXE-…', nom, description, created_at, updated_at)
niveau_axe     (id uuid, axe_id → axe, nom, ordre)                       UNIQUE(axe_id, ordre)
modalite       (id uuid, public_id, axe_id → axe, niveau_axe_id → niveau_axe, nom,
                parent_id → modalite NULL)
               -- règle applicative : le parent est du même axe et du niveau d'ordre précédent

indicateur_axe        (indicateur_id, axe_id, ordre, fonction SUM|AVG)     PK(indicateur_id, axe_id)
                      UNIQUE(indicateur_id, ordre)
                      -- ordre = ordre de déclaration (sert entre axes, D8) ; fonction : D14

combinaison           (id uuid, cle UNIQUE)   -- cle = uuids des modalités triés, joints par `,`
                      -- la combinaison vide (cle = '') est créée par la migration, retrouvée par sa clé
combinaison_modalite  (combinaison_id → combinaison, axe_id → axe, (modalite_id, axe_id) → modalite(id, axe_id))
                      PK(combinaison_id, axe_id)          -- au plus une modalité par axe, de cet axe

valeur_avancement.combinaison_id NOT NULL → combinaison   -- les valeurs existantes : la combinaison vide
UNIQUE(indicateur_id, individu_id, combinaison_id, date)
```

Inchangés : `objectif_indicateur_individu`, `indicateur_individu_commentaire` (et donc les niveaux de
confiance), `referentiel`, `individu`, `relation`, `indicateur_referentiel`.

### Exemple

| Table               | Lignes                                                                                                                                            |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `axe`               | AXE-OPERATEUR « Opérateur » ; AXE-FRAUDE « Type de fraude »                                                                                       |
| `niveau_axe`        | Opérateur (AXE-OPERATEUR) ; Famille, Type (AXE-FRAUDE)                                                                                            |
| `modalite`          | OP-ORANGE, OP-SFR (niveau Opérateur) ; FR-FISCALE (Famille) ; FR-TVA, FR-IR (Type, parent FR-FISCALE)                                             |
| `indicateur_axe`    | IND-101 → Opérateur ; IND-102 → Type de fraude ; IND-103 → Opérateur + Type de fraude ; IND-003 : aucune ligne                                    |
| `combinaison`       | C0 vide ; C1 {Orange} ; C2 {SFR} ; C3 {TVA} ; C4 {Orange, TVA}                                                                                    |
| `valeur_avancement` | (IND-003, DEPT-84, C0, juin, 59,7) ; (IND-101, DEPT-84, C1, juin, 3 857) ; (IND-101, DEPT-84, C2, juin, 2 450) ; (IND-103, DEPT-84, C4, juin, 42) |

Calculé à la lecture, jamais stocké : IND-101 · DEPT-84 · tous opérateurs = 3 857 + 2 450 = 6 307 ;
IND-102 · DEPT-84 · Fraude fiscale = TVA + IR.

---

## 5. Sémantique de calcul (indicateurs à axes)

Les indicateurs **sans axe** suivent le chemin de calcul actuel, inchangé (`loadSousArbre`,
`resolveSerieIndividu`, `resolveObjectifIndividu`).

1. **Chemin 1 (D8).** Pour une cellule « individu I, combinaison partielle » :
   - si I est une feuille territoriale (ou son niveau est saisi, fonction NONE) : on agrège les axes
     **à ce niveau**, axe par axe : le premier axe déclaré est combiné en premier (au plus près des saisies),
     avec la fonction de l'axe (D14) à chaque niveau de l'axe puis pour « Tous » ;
   - sinon : on calcule la même cellule pour chaque enfant territorial, puis on remonte avec la fonction du
     référentiel (chemin existant).
2. **Modalité parente** (ex. Fraude fiscale) : agrégat de ses enfants avec la fonction de leur niveau.
3. **Modalités absentes (cube creux).** Pour un individu donné, seules les modalités observées au moins une
   fois (sur tout l'historique) sont attendues. Un opérateur absent d'un département ne compte pas comme 0.
4. **Couverture** : enfants avec valeur / enfants attendus, comme aujourd'hui. **Contributions** : les enfants
   de l'étape d'agrégation.
5. **Valeurs permissives** : report de la dernière valeur connue, comme aujourd'hui.
6. **Saisie** : sur une modalité feuille de chaque axe déclaré (D9).

### Exemple de référence (à mettre en test)

« Points d'accueil pour 10 000 habitants », somme sur les opérateurs, moyenne sur le territoire. PACA réduite à
Vaucluse (84) et Bouches-du-Rhône (13). Valeurs : 84 × France Travail = 1, 84 × CAF = 2, 13 × France Travail = 3,
13 × CAF absent.

- Chemin 1 (retenu) : 84 = 1 + 2 = 3 ; 13 = 3 ; **PACA = (3 + 3) / 2 = 3**.
- Chemin 2 (écarté) : France Travail PACA = 2 ; CAF PACA = 2 ; PACA = 4.
- Limite connue : la décomposition par opérateur affichée sur PACA (2 et 2) ne retombe pas sur le total (3).
  C'est assumé (cf. point n°1 de PIL-1963) ; les ratios stockés en numérateur/dénominateur seraient un chantier
  à part.

---

## 6. API (cible)

- `GET/PUT /axes`, niveaux et modalités : lectures ouvertes à tout utilisateur authentifié, écritures réservées aux
  clés API ADMIN. Le niveau d'une modalité se déduit de son parent, et le parent est fixé à la création (pas de
  déplacement : suppression puis recréation).
- `PUT /indicateurs/{id}` accepte `axes: [{ id, fonction }]` (optionnel, la position donne l'ordre) ; champ
  `axes: [{ id, nom, fonction }]` ajouté aux lectures d'indicateur.
- Lectures de valeurs : paramètre optionnel `modalites=<publicIds séparés par des virgules>`, au plus une par
  axe ; absent = marginale sur tous les axes. Format exact à figer dans PIL-1991.
- Écritures `PUT /indicateurs/{id}/valeurs` et `valeurs:batch` : champ optionnel `modalites` en plus de
  `individu`. Format historique `{individu, date, valeur}` inchangé pour un indicateur sans axe.
- Nouvelles erreurs : `MODALITE_MANQUANTE`, `MODALITE_INCONNUE`, `AXE_NON_DECLARE`, saisie sur une modalité non
  feuille, doublon dans un lot.
- Rétrocompatibilité : les réponses existantes ne changent pas ; seuls des champs s'ajoutent.

---

## 7. Différences avec le POC

| Sujet                      | POC (`claude/individu-dimension-poc-f01d87`)                                                                             | Retenu                                                                         |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------ |
| Terme                      | Dimension, membre, niveau = référentiel                                                                                  | Axe, modalité, niveau d'axe                                                    |
| Territoire                 | Une dimension comme les autres ; le référentiel devient un niveau (`referentiel.dimension_id`, migration par union-find) | Inchangé, hors des axes                                                        |
| Porteur des faits          | `cellule_id` remplace `individu_id` sur valeurs, objectifs, commentaires (migration destructive)                         | `individu_id` conservé ; `combinaison_id` ajouté **sur les valeurs seulement** |
| Identité API d'une cellule | `DEPT-84~OP-ORANGE`                                                                                                      | `individu=DEPT-84` + `modalites=OP-ORANGE`                                     |
| « Territoire = Tous »      | Existe, en doublon de « France »                                                                                         | N'existe pas (individu obligatoire)                                            |
| Ordre d'agrégation         | Réglable par indicateur (`ordre`, admin « Ordre 0, 1… »)                                                                 | Imposé : chemin 1                                                              |
| Objectifs                  | Sur un sous-cube (`porteObjectifs`), projection                                                                          | Sur l'individu ; taux sur la marginale                                         |
| Commentaires, confiance    | Par cellule                                                                                                              | Sur l'individu                                                                 |
| Collections                | `nonApplicable` pour les collections mixtes                                                                              | Hors périmètre                                                                 |
| Tableaux de bord           | Sélecteur restreint aux dimensions partagées                                                                             | Hors périmètre (affichent la marginale)                                        |
| Cloisonnement              | Périmètre par membre, fail-closed (4 migrations)                                                                         | Hors périmètre                                                                 |
| Relations                  | Erreurs `DIMENSIONS_DIFFERENTES`, `FAITS_MASQUES`                                                                        | Sans objet                                                                     |
| `PUT /indicateurs`         | Étendu avec `dimensions[]`                                                                                               | Champ `axes` optionnel ajouté                                                  |
| Activation                 | —                                                                                                                        | Pas de feature flag (D12)                                                      |

### Ce qu'on reprend du POC (comme point de départ, à adapter à `dev`)

| Besoin                                      | Fichier du POC                                                                                                                                                                                                                    |
| ------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Snapshot des lectures                       | `apps/kpilote-api/scripts/poc-dimensions/snapshotLecture.ts`                                                                                                                                                                      |
| Tests de non-régression des écritures       | blocs « rétrocompatibilité pilote-ppg » de `apps/kpilote-api/src/valeurAvancement/routes.test.ts` et `apps/kpilote-api/src/indicateur/routes.test.ts`                                                                             |
| Calcul de la marginale, support, couverture | `apps/kpilote-api/src/dimension/buildGrapheCube.ts` (+ test) — logique d'éclatement à refaire selon le chemin 1                                                                                                                   |
| Erreurs d'écriture                          | `apps/kpilote-api/src/dimension/erreurCellule.ts`, `celluleEcriture.ts`                                                                                                                                                           |
| Import Albert à plusieurs colonnes          | `apps/kpilote-api/src/valeurImport/choisirDimensionsColonnes.ts`, `commands/normaliserValeursImport.ts`, `appliquerPlan.ts`, `calls/resoudreIndividus.ts`                                                                         |
| Import webapp                               | `apps/kpilote-webapp/src/components/import-valeurs/*` (colonnes d'identité dynamiques)                                                                                                                                            |
| Fiche indicateur                            | `apps/kpilote-webapp/src/lib/individus/cellule.ts`, `decomposition.ts`, `components/indicateurs/IndicateurValeursDecomposeesChart.tsx`, `IndicateurResultatsTab.tsx`, `IndicateurSynthesePanel.tsx`, `widgets/carteFranceData.ts` |
| Admin                                       | `apps/kpilote-admin/src/components/DimensionForm.tsx`, `routes/_authed/dimensions/*`, `components/indicateurs/AdminDimensions.tsx`                                                                                                |
| Données de démo                             | seed IND-101 (Territoire × Opérateur), IND-102 (Type de fraude × Territoire) dans `prisma/seedData/dimensions.ts` ; carto-sp (commit local `2f9ea9d21`)                                                                           |

Pour lire un fichier du POC : `git show origin/claude/individu-dimension-poc-f01d87:<chemin>`.

---

## 8. Livraison incrémentale

- Une sous-tâche Jira = une PR, empilée avec `gh stack`.
- kpilote n'a pas de prod avec de vrais utilisateurs : pas de fenêtre de compatibilité avec le code précédent, ni
  d'expand / contract. Une migration doit seulement migrer correctement les données existantes.
- Chaque PR fait tourner le **snapshot des lectures** (PIL-1979) : 0 différence réelle pour les indicateurs
  existants.
- Tant qu'aucun indicateur n'a d'axe, aucun comportement ne change pour l'existant. Les pages et routes neuves
  (axes) sont visibles dès leur livraison : c'est accepté (D12).

---

## 9. Points ouverts

1. **Rejeu pilote-ppg (PIL-1979).** Depuis le 2026-11-10, `dev` ne contient plus la synchronisation pilote-ppg
   → kpilote (commit `55d4ed4b5`, PR #2668 : « supprime la synchronisation vers kpilote, inutilisée »). Le
   « rejeu pilote-ppg » n'a donc plus de consommateur à protéger. Proposition : garder ces tests sous le nom
   « non-régression des écritures » (comportement actuel de `valeurs:batch` et `PUT /indicateurs`), sans
   référence à pilote-ppg. **À confirmer avec Antoine**, puis mettre à jour PIL-1979 et la description de
   PIL-1963.
2. **Format exact de `modalites=`** et de la décomposition dans l'API : à figer dans PIL-1991 / PIL-1998.
3. **Ticket PIL-1980** (feature flag) : abandonné (D12), à supprimer dans Jira.

---

## 10. Conventions du projet (rappel pour un agent)

- Exports et imports **nommés** uniquement.
- Helpers : un **objet de paramètres nommés**.
- Commands et queries : **`ResultAsync`** (neverthrow) ; promesses externes enveloppées avec
  `ResultAsync.fromPromise`.
- Une route = **un seul fichier** (schémas Zod + `createRoute` + handler).
- Configuration liée à des entités utilisateur **en base** (tables + seed), jamais de registre TS.
- API **agnostique de l'UI** : pas de champ qui matérialise un choix d'UX.
- Pas de `db().$transaction([...])` imbriqué dans une transaction existante.
- Prisma : pas de `select` granulaires imbriqués ; filtres d'enum via un const typé, pas `as const`.
- Tests : `uuidv7`, valeurs codées en dur, fixtures `fixtures.<entite>(...)` variadiques avec upsert. On lance
  les tests soi-même.
- Migrations : `prisma migrate deploy` (pas `migrate dev`, drift permanent sur `raw_data`).
- UI : cacher plutôt que désactiver quand une action n'est pas autorisée.
- Code transverse (helper générique, middleware) : présenter les options avant d'écrire.
- Nouveau pattern = nouveau code seulement, pas de refactor de l'existant hors périmètre.
- Apps lancées via portless sous leurs noms de dev ; seules les bases ont un port.
- Titre de PR terminé par le ticket : `(PIL-XXXX)`.
