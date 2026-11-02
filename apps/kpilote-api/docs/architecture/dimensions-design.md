# Dimensions d'observation : l'individu devient une dimension comme une autre

Date : 2026-11-02
Statut : POC implémenté (branche `claude/individu-dimension-poc-f01d87`, non poussée) — modèle retenu : **M1‴**
Brief : [`dimensions-poc-brief.md`](dimensions-poc-brief.md)

## 1. Contexte

Aujourd'hui une observation est `(indicateur, individu, date) → valeur`
(`valeur_avancement_unique`). Il en va de même pour les objectifs
`(indicateur, individu, dateCible)` et les commentaires `(indicateur, individu)`.

- Un individu appartient à un seul référentiel.
- La seule hiérarchie est `Relation` (NAT → REG → DEPT). Elle est parcourue par
  `loadSousArbre` puis résolue par `resolveSerieIndividu` (permissif) et
  `resolveObjectifIndividu` (strict).
- La fonction d'agrégation est portée par le couple `(indicateur, référentiel)`.
- Le mot « référentiel » recouvre en fait deux notions : REF-NAT, REF-REG et
  REF-DEPT sont trois **niveaux** d'une même **dimension** « territoire ».

Les utilisateurs veulent croiser des dimensions arbitraires : « fraude par type ×
territoire », « territoire × opérateur ». Le contournement actuel crée un indicateur
par opérateur, puis une collection d'opérateurs. Il a deux défauts :

- la collection moyenne des **taux de progression** et n'additionne jamais les
  **valeurs** (`resolveCollectionTauxProgression`) ;
- il ne doit son cloisonnement d'écriture par opérateur qu'à la découpe en
  indicateurs.

**Contrainte dure** : un indicateur mono-dimension garde exactement la même UI, les
mêmes URL et les mêmes contrats. Cela inclut la synchro pilote-ppg
(`PUT /indicateurs/{id}/valeurs:batch` avec `{individu, date, valeur}`, et
`PUT /indicateurs/{id}` avec `referentiels[{id, fonctionAgregation}]`).

### Vocabulaire commun à tous les modèles

| Terme          | Définition                                                                                                                                                                              |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Dimension**  | Axe d'observation nommé (Territoire, Opérateur, Type de fraude). Entité en base.                                                                                                        |
| **Niveau**     | Un référentiel. Chaque référentiel appartient à une dimension. REF-NAT, REF-REG et REF-DEPT sont trois niveaux de la dimension Territoire.                                              |
| **Membre**     | Un individu. Son niveau (référentiel) détermine sa dimension.                                                                                                                           |
| **Coordonnée** | Un couple (dimension, membre).                                                                                                                                                          |
| **Cellule**    | Un ensemble de coordonnées, au plus une par dimension. Une cellule est **complète** pour un indicateur si elle porte une coordonnée sur chacune de ses dimensions, **partielle** sinon. |
| **Marginale**  | Une cellule partielle, lue comme « tous » sur les dimensions absentes. Exemple : DEPT-84, tous opérateurs.                                                                              |
| **Tranche**    | L'ensemble des cellules où une dimension varie (sur un niveau) et où les autres coordonnées sont fixées.                                                                                |

---

## 2. Modèles étudiés

Chaque modèle répond aux 10 questions du brief (§3.2) :

| #   | Question                                   |
| --- | ------------------------------------------ |
| Q1  | Identité et unicité                        |
| Q2  | Ce qu'un indicateur déclare                |
| Q3  | Coordonnée partielle                       |
| Q4  | Agrégation multi-axes                      |
| Q5  | Cube creux et couverture                   |
| Q6  | Tranches de comparaison et carte           |
| Q7  | Grain des objectifs et taux de progression |
| Q8  | Permissions                                |
| Q9  | Rétrocompatibilité                         |
| Q10 | Volumétrie et complexité UI                |

### M1 — Entité `Cellule` par indicateur, marginale = coordonnée absente, cascade canonique

**Schéma**

```
dimension(id, public_id DIM-…, nom, description)
referentiel.dimension_id NOT NULL                     -- un niveau appartient à une dimension
indicateur_dimension(indicateur_id, dimension_id, ordre, fonction_agregation, porte_objectifs)
cellule(id, indicateur_id, cle TEXT)  UNIQUE(indicateur_id, cle)
                                      -- cle = uuids des membres triés, joints par ','
cellule_coordonnee(cellule_id, dimension_id, individu_id)  PK(cellule_id, dimension_id)
valeur_avancement.cellule_id                         UNIQUE(indicateur_id, cellule_id, date)
objectif_indicateur_individu.cellule_id              UNIQUE(indicateur_id, cellule_id, date_cible)
indicateur_individu_commentaire.cellule_id
```

`individu_id` reste renseigné sur les cellules mono-coordonnée. Il sert de compatibilité
et de clé de lecture rapide.

- **Q1.** `UNIQUE(indicateur_id, cle)` sur `cellule`, puis
  `UNIQUE(indicateur_id, cellule_id, date)` et `ON CONFLICT` sur cette contrainte. La
  clé canonique est la liste triée des uuids de membres, calculable en JS comme en SQL.
  Les clés étrangères (FK) vers `individu` sont réelles, via `cellule_coordonnee`.
- **Q2.** L'indicateur déclare des **niveaux**, comme aujourd'hui (`IndicateurReferentiel`
  et sa fonction de niveau). Ses **dimensions** s'en déduisent (le `dimension_id` de chaque
  niveau). `indicateur_dimension` porte la configuration propre à chaque dimension :
  - `ordre` de remontée ;
  - fonction de la **racine virtuelle** (la marginale) ;
  - `porte_objectifs`.
- **Q3.** « DEPT-84 » seul sur territoire × opérateur est une **marginale dérivée**
  (DEPT-84, tous opérateurs). Les valeurs ne se saisissent que sur des cellules
  complètes ; une cellule partielle en écriture renvoie `COORDONNEE_MANQUANTE`.
- **Q4.** Cascade **canonique**. On éclate la cellule selon la première dimension, dans
  l'ordre `ordre`, dont la coordonnée est agrégée :
  - une coordonnée est agrégée si le membre a des enfants et que la fonction de son
    niveau ≠ NONE ;
  - une coordonnée absente compte comme la racine virtuelle, avec la fonction de
    `indicateur_dimension`.

  Les enfants sont la cellule où cette seule coordonnée est remplacée par chacun de ses
  enfants. La règle est appliquée récursivement et mémoïsée par cellule. La dimension de
  plus petit ordre est donc l'opération la plus **externe**. L'AVG est déterministe
  (« moyenne des moyennes » selon l'ordre). Les valeurs sont permissives et les objectifs
  stricts, comme aujourd'hui, avec une fonction **par niveau** plus une fonction de
  marginale par dimension.

- **Q5.** Un enfant est attendu s'il est enfant `Relation` du membre éclaté et que l'une
  de ces deux conditions est vraie :
  - (a) toutes les autres coordonnées de la cellule sont à la racine (absentes ou
    racine de leur dimension) ;
  - (b) la sous-cellule de l'enfant contient au moins une `cellule` existante (support).

  En mono-dimension, la condition (a) est toujours vraie. On retrouve donc le
  comportement actuel : tous les enfants `Relation` sont attendus. La couverture est
  calculée à chaque étape d'éclatement.

- **Q6.** Une tranche est définie par la dimension qui varie, le niveau de comparaison
  et les coordonnées fixées des autres dimensions. Les valeurs remarquables et la carte
  prennent `referentiels` (le niveau) et `fixe=` (une cellule partielle). Par défaut,
  toutes les autres dimensions sont « tous ».
- **Q7.** `porte_objectifs` définit le **sous-cube des objectifs**. Un objectif se saisit
  sur une cellule complète **de ce sous-cube**. Le taux de progression d'une cellule
  existe quand ses coordonnées hors sous-cube sont absentes (marginales) ; il est
  apparié à l'objectif de la projection de la cellule. Exemple : objectif sur
  (DEPT-84), valeurs sur (DEPT-84, OP-x). Le taux (DEPT-84, tous) vaut la valeur
  dérivée divisée par l'objectif saisi. Le taux de (DEPT-84, OP-x) est absent.
- **Q8.** Nouvelle table `indicateur_permission_perimetre(principal_id, indicateur_id,
individu_id)`. Si un `WRITE_DATA` a un périmètre, l'écriture n'est autorisée que sur
  les cellules dont une coordonnée est le membre du périmètre ou l'un de ses
  descendants.
- **Q9.** `individu` est accepté comme cellule à une coordonnée. Le paramètre
  `individus=` accepte des cellules (`DEPT-84~OP-ORANGE`). Les réponses mono-dimension
  sont identiques. Le champ `coordonnees` n'apparaît que sur un indicateur
  multi-dimension. Le contrat `referentiels[]` de `PUT /indicateurs` est inchangé : les
  dimensions se déduisent et `indicateur_dimension` est complété avec des défauts.
- **Q10.** Le sous-cube vaut le produit des sous-arbres, borné par le support : les
  cellules inexistantes ne sont jamais chargées. Côté UI : un sélecteur par dimension
  (option « Tous »), invisible quand il n'y a qu'une dimension.

### M2 — Tableau canonique de coordonnées sur les faits + membre « TOUS » explicite

**Schéma**

```
dimension(...) ; referentiel.dimension_id
valeur_avancement.coordonnees UUID[] NOT NULL   -- uuids triés
  UNIQUE(indicateur_id, coordonnees, date), index GIN
objectif_…coordonnees UUID[] ; indicateur_individu_commentaire.coordonnees UUID[]
```

Chaque dimension a un niveau racine REF-XXX-TOUS, qui contient un individu XXX-TOUS
relié par `Relation` à tous les membres de premier niveau.

- **Q1.** Contrainte `UNIQUE` sur le tableau trié (btree sur `uuid[]`) et `ON CONFLICT`
  sur cette contrainte. Il n'y a pas de FK sur les éléments : l'intégrité passe par un
  trigger ou par le code.
- **Q2.** Les niveaux (`IndicateurReferentiel`), y compris les niveaux TOUS avec leur
  fonction. Il n'y a pas de table de dimension par indicateur.
- **Q3.** Une coordonnée est **toujours complète**. « DEPT-84 tous opérateurs » s'écrit
  (DEPT-84, OP-TOUS). « DEPT-84 » seul est un raccourci résolu vers la cellule
  `TOUS` de chaque autre dimension.
- **Q4.** Toute cellule dont au moins une coordonnée est agrégée se dérive. Il y a deux
  options, l'ordre canonique ou « toutes les dimensions agrégées à la fois » (produit
  des enfants). Le produit cartésien est rejeté, car il est faux sur un cube creux.
  L'ordre retenu est celui des uuids de dimension : l'ordre de remontée n'est donc ni
  configurable, ni explicite.
- **Q5.** Les enfants attendus sont tous les enfants `Relation`. Les membres TOUS
  rendent les trous visibles comme `manquante`, sauf à déclarer une liste explicite.
- **Q6.** Une tranche est la population d'un niveau, les autres coordonnées étant
  fixées (TOUS par défaut).
- **Q7.** L'objectif est saisi sur (DEPT-84, OP-TOUS). Mais OP-TOUS est un nœud agrégé :
  la règle D6 (saisie d'un nœud agrégé ignorée) jette l'objectif. Il faut donc une
  exception « objectif saisi prioritaire » qui change la sémantique actuelle des
  objectifs.
- **Q8.** Aucune table nouvelle n'est possible sans FK (filtre par `@>` sur le
  tableau). On crée un périmètre comme en M1.
- **Q9.** En mono-dimension, `coordonnees = [individu_id]` (migration triviale). Les
  membres TOUS doivent être créés et maintenus par l'admin : chaque nouvel opérateur
  doit être relié à OP-TOUS.
- **Q10.** C'est le moins de tables, avec un index GIN performant. Mais il y a des
  individus techniques visibles partout (sélecteurs, cartes, import), à masquer côté UI.

### M3 — Schéma en étoile à emplacements fixes, agrégation à plat depuis les feuilles

**Schéma**

```
valeur_avancement(indicateur_id, axe1_individu_id, axe2_individu_id NULL, axe3_individu_id NULL, date, valeur)
  UNIQUE NULLS NOT DISTINCT(indicateur_id, axe1, axe2, axe3, date)
indicateur_dimension(indicateur_id, dimension_id, emplacement 1..3, fonction)
```

- **Q1.** Une contrainte `UNIQUE NULLS NOT DISTINCT` (PG ≥ 15), des FK réelles sur
  chaque emplacement, `ON CONFLICT` direct.
- **Q2.** Les dimensions et leur emplacement (au plus 3), avec une fonction **par
  dimension**. Les niveaux servent seulement à valider les membres.
- **Q3.** Une marginale = un emplacement filtré sur « tout le sous-arbre ».
- **Q4.** **Pas de cascade** : une cellule = `agg(feuilles de son sous-cube)`, en une
  requête SQL `GROUP BY`. Le SUM est exact. L'AVG est la moyenne **à plat des
  feuilles**, ce qui casse la sémantique actuelle « moyenne des moyennes » (D2 de
  `valeurs-derivees-design.md`) pour les indicateurs mono-dimension en AVG. La
  sémantique permissive par carry-forward doit être réécrite en SQL (fenêtres
  `LAST_VALUE … IGNORE NULLS` par feuille).
- **Q5.** On ne compte que les feuilles présentes. La couverture se calcule en
  feuilles, pas en enfants directs : la sémantique de `couverture` change.
- **Q6.** Un `GROUP BY` sur l'emplacement qui varie : très efficace.
- **Q7.** Un objectif sur un sous-ensemble d'emplacements (les autres à NULL), apparié
  par projection.
- **Q8.** Un périmètre par emplacement (filtre SQL simple).
- **Q9.** Une limite dure de 3 dimensions dans le schéma. La migration mono-dimension
  est triviale (`axe1 = individu_id`), mais **l'AVG mono-dimension change de valeur**.
- **Q10.** C'est le meilleur pour la volumétrie (35k communes) : c'est l'agrégation SQL.
  L'UI est identique aux autres modèles.

### M4 — Axe principal conservé + une ventilation secondaire

**Schéma**

```
valeur_avancement.individu_id (inchangé) + ventilation_id NULL FK individu
  UNIQUE NULLS NOT DISTINCT(indicateur_id, individu_id, ventilation_id, date)
indicateur.referentiel_ventilation_id NULL, fonction_ventilation
```

- **Q1.** Une contrainte unique avec un `NULL` distinctif. Les FK sont réelles.
- **Q2.** Des niveaux principaux (inchangés) et **un** référentiel de ventilation au
  plus.
- **Q3.** `individu` seul = total sur la ventilation (dérivé par la fonction de
  ventilation), ou saisie directe sans ventilation : il y a ambiguïté si les deux
  coexistent.
- **Q4.** L'ordre est fixe : ventilation d'abord, puis la hiérarchie principale. L'AVG
  est déterministe. La ventilation n'a pas de hiérarchie.
- **Q5.** Un membre de ventilation est attendu s'il a déjà une valeur sur l'individu.
- **Q6.** Une tranche est la population principale à ventilation fixée, ou les membres de
  ventilation à individu fixé.
- **Q7.** L'objectif est sur `(individu, ventilation NULL)` : c'est naturel.
- **Q8.** Un périmètre sur le membre de ventilation.
- **Q9.** C'est le plus rétrocompatible : rien ne bouge pour `ventilation_id IS NULL`.
- **Q10.** Simple, mais **plafonné à 2 dimensions**. La « fraude type × territoire ×
  canal » est impossible. Ce n'est pas « une dimension comme une autre » : l'individu
  reste privilégié.

### M5 — Individus composites dans un référentiel produit, DAG multi-parents

**Schéma**

Aucun changement sur les tables de faits. Un référentiel produit
« REF-DEPT×REF-OPERATEUR » contient des individus synthétiques `DEPT-84×OP-1`, qui ont
**deux parents** `Relation` : (REG-93×OP-1) et (DEPT-84). Le moteur actuel est réutilisé
tel quel.

- **Q1.** L'individu composite est la cellule : la clé actuelle `(indicateur, individu,
date)` est inchangée.
- **Q2.** Les niveaux, y compris les niveaux produits (générés).
- **Q3.** « DEPT-84 » est un individu existant, parent des composites : c'est donc une
  dérivée sur tous ses enfants composites.
- **Q4.** `loadSousArbre` suit **tous** les parents. Le parent DEPT-84 agrège ses
  composites, et REG-93 agrège… ses départements **et** les composites REG-93×OP-k : il
  y a un double comptage, sauf à interdire une des deux branches. L'ordre est implicite
  (la topologie du DAG). L'AVG dépend du chemin.
- **Q5.** Seuls les composites créés sont attendus : la matérialisation sert de support.
- **Q6.** Des tranches entre référentiels produits : non naturel.
- **Q7.** Un objectif sur DEPT-84 (un nœud agrégé) est ignoré par D6.
- **Q8.** Des permissions par individu composite (ingérable).
- **Q9.** Les contrats ne changent pas, mais l'explosion combinatoire est visible dans
  tous les sélecteurs.
- **Q10.** Il faut 35k communes × N individus matérialisés, et les relations à 2
  parents. L'UI doit reconstruire les dimensions à partir de noms composites.

---

## 3. Matrice de comparaison

Légende : ✅ bon · ⚠️ compromis · ❌ rédhibitoire. M1‴ est M1 après les trois tours de challenge (§4).

| Critère                                   | M1‴ (retenu)                          | M2 tableau + TOUS  | M3 étoile             | M4 ventilation            | M5 composites        |
| ----------------------------------------- | ------------------------------------- | ------------------ | --------------------- | ------------------------- | -------------------- |
| Dimensions arbitraires (N)                | ✅ (5 par cellule)                    | ✅                 | ⚠️ 3 max              | ❌ 2 max                  | ✅                   |
| Intégrité FK des coordonnées              | ✅                                    | ❌ trigger         | ✅                    | ✅                        | ✅                   |
| Sémantique d'agrégation non ambiguë       | ✅ ordre persisté                     | ❌ ordre = uuid    | ❌ AVG à plat         | ⚠️ total ≠ tranches       | ❌ double comptage   |
| Mono-dimension strictement identique      | ✅ chemin gelé, prouvé (§5.8)         | ✅                 | ❌ AVG, couverture    | ✅                        | ❌ topologie globale |
| Cube creux / couverture                   | ⚠️ support inféré (limite documentée) | ❌ 3/12 permanent  | ⚠️ feuilles présentes | ❌ piloté par les données | ⚠️                   |
| Objectif à grain grossier                 | ✅ sous-cube d'objectifs              | ❌ D6              | ⚠️ projection ambiguë | ✅                        | ❌                   |
| Saisies masquées sans signal              | ✅ verrous feuille-à-faits            | ❌                 | ❌                    | ❌                        | ❌                   |
| Cloisonnement par membre                  | ✅ fail-closed, atomique              | ⚠️                 | ⚠️                    | ❌ absent                 | ❌                   |
| Config en base, sans maintenance manuelle | ✅                                    | ❌ membres TOUS    | ✅                    | ✅                        | ❌                   |
| Import 2 colonnes d'identité              | ✅                                    | ⚠️                 | ⚠️                    | ❌                        | ❌                   |
| Volumétrie (35k × N)                      | ⚠️ JS borné par le support            | ❌ produit énuméré | ✅ SQL                | ⚠️                        | ❌                   |
| Synchro pilote-ppg                        | ✅                                    | ✅                 | ⚠️ PG ≥ 15            | ✅ sous conditions        | ⚠️ replace-all       |

## 4. Journal du challenge

Méthode (brief §3.3) : chaque modèle est attaqué par un sous-agent **indépendant**. Il reçoit
le code, le texte du modèle et les 9 scénarios de rupture, mais ni la matrice ni nos
conclusions. Il ne lit pas ce document.

Le challenge s'est fait en quatre passes :

- tour 1 : 5 agents, un par modèle ;
- tour 2 : M1′, qui intègre les objections du tour 1 ;
- tour 3 : M1″ ;
- tour 4 : les corrections exigées au tour 3 sont intégrées dans M1‴, puis vérifiées par la
  revue adversariale du diff final (§11).

Scénarios :

- S1 fraude type × territoire ;
- S2 cube creux ;
- S3 AVG sur deux dimensions ;
- S4 objectif grossier ;
- S5 import 2 colonnes ;
- S6 collection mixte ;
- S7 cloisonnement ;
- S8 volumétrie ;
- S9 pilote-ppg.

### Tour 1 — verdicts

| Modèle | S1      | S2      | S3    | S4      | S5      | S6      | S7      | S8      | S9               | Verdict                                |
| ------ | ------- | ------- | ----- | ------- | ------- | ------- | ------- | ------- | ---------------- | -------------------------------------- |
| M1     | CASSE   | CASSE   | CASSE | FRAGILE | CASSE   | CASSE   | CASSE   | FRAGILE | TIENT*           | stockage OK, moteur et droits à revoir |
| M2     | FRAGILE | CASSE   | CASSE | CASSE   | CASSE   | FRAGILE | FRAGILE | CASSE   | TIENT*           | ne survit pas                          |
| M3     | FRAGILE | FRAGILE | CASSE | FRAGILE | FRAGILE | FRAGILE | FRAGILE | FRAGILE | TIENT*           | ne survit pas (stockage récupérable)   |
| M4     | FRAGILE | CASSE   | CASSE | FRAGILE | CASSE   | FRAGILE | CASSE   | FRAGILE | TIENT*           | ne survit pas (2 axes max)             |
| M5     | CASSE   | CASSE   | CASSE | CASSE   | CASSE   | CASSE   | CASSE   | CASSE   | TIENT (mono pur) | ne survit pas                          |

\* sous conditions de déploiement (expand/contract).

### Objections de tour 1 et réponses

| Objection (modèle, scénario)                                                                                                                                                                                                                           | Réponse                                                                                                                                                                                          |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| M5 : la topologie `Relation` est **globale**. Ajouter des composites sous DEPT-84 rend DEPT-84 agrégé pour tous les indicateurs (SUM est la valeur par défaut de l'admin). La saisie est ignorée et la série vide, donc la contrainte mono est violée. | M5 écarté. Leçon retenue : **ne jamais** modifier le graphe partagé pour un besoin multi-dimension. M1‴ ne touche pas au chemin mono (§5.8).                                                     |
| M5 S1 : double ou triple comptage (350 → 700 → 1050) par plusieurs chemins dans le DAG.                                                                                                                                                                | Cascade canonique : on éclate **une seule** coordonnée à la fois, dans l'ordre déclaré.                                                                                                          |
| M3 S3 : l'AVG « à plat » change le mono (15 → 17,5) et ne sait pas exprimer les fonctions mixtes (160 face à 115).                                                                                                                                     | Fonction **par niveau** conservée, cascade niveau par niveau. Le SQL à plat (équivalent pour SUM pur, démontré par l'agent) reste une optimisation future.                                       |
| M3/M2 S2 : couverture « feuilles présentes » (couverture redéfinie) ou membre TOUS global (3/12 permanent, objectif strict jamais émis).                                                                                                               | Couverture par **enfants directs** (comme aujourd'hui). Hors marginale pure, les enfants attendus sont ceux qui ont du **support** (§5.4).                                                       |
| M2 S3 : ordre de remontée fixé par l'uuid des dimensions, donc différent selon l'environnement.                                                                                                                                                        | `indicateur_dimension.ordre` persisté et déclaré explicitement (§5.3).                                                                                                                           |
| M2/M5 S4 : un objectif saisi sur un nœud agrégé (OP-TOUS, DEPT-84) est jeté par D6.                                                                                                                                                                    | **Sous-cube des objectifs** (`porteObjectifs`) : l'objectif se saisit au grain où il existe (§5.6).                                                                                              |
| M4 S2/S3 : population et préséance pilotées par les données ; total ≠ tranches.                                                                                                                                                                        | M4 écarté (plafonné à 2 axes et asymétrique). La préséance saisie/dérivée est traitée au tour 2.                                                                                                 |
| Tous S5 : le plan Albert ne connaît qu'une colonne ; « Orange » commune ≠ opérateur ; `DUPLICATE_KEY` ; pivot sur dates seulement.                                                                                                                     | Plan à N colonnes d'identité, résolution **par colonne** restreinte à une dimension, clé (colonne, libellé), lignes partielles écartées avec avertissement (§5.9). Pivot par membres hors scope. |
| Tous S6 : la règle tout-ou-rien rend null une collection mixte.                                                                                                                                                                                        | Statut **non applicable** (exclu de la moyenne) quand l'indicateur ne peut pas observer la cellule demandée (§5.7).                                                                              |
| M1/M4/M3 S7 : pas de périmètre ; OU entre dimensions ; fail-open ; WRITE_DATA modifie la structure.                                                                                                                                                    | Périmètre ET entre dimensions et OU dans une dimension, fail-closed. Un principal restreint ne peut pas faire `PUT /indicateurs` (§5.10).                                                        |
| M1/M2 S9 : `PUT /indicateurs` est en replace-all ; un client externe retire une dimension ajoutée côté kpilote.                                                                                                                                        | Remplacement **par dimension** en multi ; ajout ou retrait de dimension refusé (409) si l'indicateur a des faits (§5.3).                                                                         |
| M1 autre : la migration `dimension_id` relit des référentiels « alternatifs » comme un produit.                                                                                                                                                        | Union-find par Relation **et par co-déclaration** : tout indicateur existant reste mono (§5.11).                                                                                                 |
| M1/M2 autre : `ON CONFLICT DO NOTHING RETURNING` sous concurrence ; tri des uuid sous collation.                                                                                                                                                       | SELECT, puis INSERT … DO NOTHING, puis relecture ; tri JS des chaînes uuid en minuscules, une seule fonction (§5.1).                                                                             |

### Tour 2 (M1′) — objections et réponses

M1′ introduisait une règle « la saisie d'une cellule non feuille vaut jusqu'au premier point
dérivé ». Verdict : **ne survit pas** (S1, S2 et S7 CASSE), mais le socle physique tient.

| Objection                                                                                                                                                                                                  | Réponse (M1″)                                                                                                                                                                                         |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| S1 : une ventilation partielle (un seul sous-type saisi) fait basculer (13,TVA) de 520 à 40 avec une couverture de 1/1. Un backfill 2019 efface toute la série. Le résultat dépend du chemin, même en SUM. | **Bascule supprimée.** On n'écrit que sur des cellules **feuilles** (`CELLULE_AGREGEE` sinon). Un nœud agrégé ignore ses saisies (D6 généralisé). Le « non ventilé » est un membre feuille explicite. |
| S7 : attaque d'intégrité. Un opérateur cloisonné écrit une valeur 2015 qui efface l'historique d'un tiers.                                                                                                 | Disparaît avec la bascule.                                                                                                                                                                            |
| S3 : NONE est interdit sur la marginale, donc une union (couverture 4G tous opérateurs) n'est pas saisissable.                                                                                             | Marginale **NONE autorisée** : la marginale devient une feuille inscriptible.                                                                                                                         |
| S3/S4 : l'ordre et `porteObjectifs` dépendent du payload à la création.                                                                                                                                    | `dimensions[]` obligatoire ; `porteObjectifs` verrouillé dès qu'un objectif existe.                                                                                                                   |
| S7 : `PUT /permissions` (delete puis create) remet le drapeau de restriction à `false`.                                                                                                                    | `PUT /permissions` **différentiel** ; FK périmètre → permission en cascade.                                                                                                                           |
| S9 : `DUPLICATE_KEY` calculé après résolution change les erreurs mono ; `referentiels: []` change.                                                                                                         | Doublons de la forme historique détectés sur la **chaîne brute** avant résolution. Replace-all historique **exact** en mono.                                                                          |
| Autre : racine virtuelle multi-racines ; niveaux sautés (NAT+DEPT sans REG) qui doublent le compte.                                                                                                        | Enfants = descendants **déclarés les plus proches** ; racines = membres sans ancêtre déclaré (§5.4).                                                                                                  |
| Autre : `individu` canonisé ≠ chaîne envoyée, ce qui casse les batchers webapp.                                                                                                                            | `individu` des cibles = **chaîne envoyée** ; forme canonique pour les contributions.                                                                                                                  |

### Tour 3 (M1″) — objections et réponses

Verdict : **survit sous conditions**. Cinq corrections sont exigées, toutes intégrées dans
M1‴ :

| Objection                                                                                                                                                                                         | Réponse (M1‴, implémentée)                                                                                                                                                                                                                                                                                                      |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| S1 : créer des sous-types sous TVA (une `Relation`) rend TVA agrégé et **masque** 2023-2025 sans signal. Même chose pour le passage d'un niveau de NONE à SUM, ou le retrait d'un niveau à faits. | **Verrous feuille-à-faits** (409) : `PUT /relations` refusé (`FAITS_MASQUES`) si le parent porte des faits sur un indicateur multi-dimension où son niveau agrège. `PUT /indicateurs` refusé s'il retire un niveau à faits, passe un niveau à faits de NONE à une agrégation, ou passe une marginale à faits de NONE à SUM/AVG. |
| S1 : un membre technique « non ventilé » rattaché à NAT casse les indicateurs **mono** (couverture 18/19, objectif NAT strict null).                                                              | Règle d'administration : un membre technique vit dans une dimension **non partagée** avec des indicateurs mono (ex. TVA-NON-VENTILE dans Type de fraude). Pour un total non territorialisé, la marginale passe en NONE (§5.5). Documenté comme limite : aucune garde automatique.                                               |
| S7 : fail-open. Un grant suivi du périmètre en deux appels laisse une fenêtre ; retirer le dernier membre lève la restriction.                                                                    | `perimetre_restreint` **explicite** (NOT NULL), posé **atomiquement** dans le même `POST /permissions/indicateur` (`perimetre`). Restreint sans ligne = aucune écriture. `HORS_PERIMETRE` par item dans un batch.                                                                                                               |
| S3 : au passage en multi, la marginale de la dimension historique reste SUM par défaut (racines DEPT en NONE : 5400 %).                                                                           | Au passage mono → multi, **toutes** les dimensions doivent figurer dans `dimensions[]`.                                                                                                                                                                                                                                         |
| S4 : un sous-cube d'objectifs à une dimension suit-il le mono (tous les enfants `Relation`) ou R3 ? Un tiers sans objectif supprime les objectifs stricts.                                        | Tout indicateur multi passe par le graphe de cellules (R3), y compris pour ses objectifs. Le **support des objectifs est calculé sur les objectifs**, celui des valeurs sur les valeurs.                                                                                                                                        |
| S9 : un batch mixte (`DEPT-84~OP-A` et `OP-A~DEPT-84`) donne un 500 (« cannot affect row a second time »).                                                                                        | Doublons aussi détectés sur la **clé canonique** de tous les items résolus.                                                                                                                                                                                                                                                     |
| S8 : `ON CONFLICT DO UPDATE` sur les cellules provoque bloat et verrous.                                                                                                                          | SELECT, puis INSERT DO NOTHING, puis relecture, en traitant les cellules par clé croissante.                                                                                                                                                                                                                                    |
| S6 : discontinuité — ajouter un indicateur multi change l'applicabilité des autres indicateurs de la collection.                                                                                  | **Assumé** : une collection 100 % mono garde la règle historique exacte (contrainte de rétrocompatibilité, vérifiée par snapshot). La règle « non applicable » ne s'active qu'en présence d'un indicateur multi-dimension. La discontinuité est documentée (§8).                                                                |

Limites acceptées par le tour 3 (catégorie b), documentées en §8 :

- non-commutativité de AVG ;
- carry-forward « zombie » ;
- couverture rétroactive ;
- volumétrie au niveau des communes ;
- lecture et commentaires non cloisonnés ;
- pivot par membres.

## 5. Décision : modèle M1‴

### 5.1 Schéma

```
dimension(id, public_id DIM-…, nom, description)
referentiel.dimension_id NOT NULL                      -- un référentiel = un niveau d'une dimension
indicateur_dimension(indicateur_id, dimension_id, ordre, fonction_agregation, porte_objectifs)
  PK(indicateur_id, dimension_id), UNIQUE(indicateur_id, ordre)
cellule(id, indicateur_id, cle)  UNIQUE(indicateur_id, cle), UNIQUE(id, indicateur_id)
  -- cle = uuids des membres triés (ASCII, minuscules) joints par ','  (dimension/cellule.ts)
cellule_coordonnee(cellule_id, dimension_id, individu_id)  PK(cellule_id, dimension_id)
valeur_avancement(…, cellule_id)  FK (cellule_id, indicateur_id) → cellule ; UNIQUE(indicateur_id, cellule_id, date)
objectif_indicateur_individu(…, cellule_id)  idem, UNIQUE(…, date_cible)
indicateur_individu_commentaire(…, cellule_id)  idem
indicateur_permission.perimetre_restreint BOOLEAN NOT NULL DEFAULT false
indicateur_permission_perimetre(principal_id, indicateur_id, action, individu_id)
  FK (principal, indicateur, action) → indicateur_permission ON DELETE CASCADE
```

`individu_id` disparaît des tables de faits. Une cellule à une coordonnée a pour clé l'uuid de
l'individu : c'est ainsi que la migration reprend l'historique.

Migrations :

- `20261102120000_dimensions_cellules` ;
- `…130000_perimetre_par_presence` ;
- `…140000_perimetre_explicite`.

Les trois sont écrites à la main, avec reprise des données, et appliquées par
`migrate deploy`. Diff final schéma ↔ base : vide.

### 5.2 Identité d'une cellule dans l'API

- Un identifiant de cellule est formé de publicIds de membres joints par `~`, dans n'importe quel
  ordre, au plus un par dimension (`celluleIdSchema`, partagé).
- `DEPT-84` est la forme historique. Sur un indicateur multi-dimension, une dimension absente veut
  dire « tous » : c'est une marginale.
- Paramètres concernés :
  - `individus=` (séries, objectifs, taux, synthèse) ;
  - `/individus/{cellule}/…` (dernières valeurs, taux) ;
  - `/indicateurs/{id}/individus/{cellule}/commentaires|brouillon|niveaux-confiance` ;
  - `collections/{id}/taux-progression?individu=`.
- Le champ `individu` des réponses reprend la chaîne envoyée pour les cibles, et la forme canonique
  (membres dans l'ordre des dimensions) pour les contributions.
- Écriture : `individu` (historique) **ou** `coordonnees: string[]`.

Choix du séparateur `~` : le caractère est non réservé dans les URL, absent de la regex des
publicIds (pas de collision), et ne demande aucun encodage.

### 5.3 Ce qu'un indicateur déclare

- Des **niveaux** (`IndicateurReferentiel` avec leur fonction de niveau), comme aujourd'hui. Ses
  **dimensions** s'en déduisent.
- Par dimension, dans `indicateur_dimension` :
  - `ordre` de remontée ;
  - fonction de la **marginale** (SUM, AVG ou NONE) ;
  - `porteObjectifs`.
- `PUT /indicateurs` (contrat pilote-ppg inchangé) :
  - mono → mono : replace-all **exact** de l'existant ;
  - multi : remplacement **par dimension**, les niveaux des dimensions absentes du payload sont
    conservés ;
  - passage en multi : `dimensions[]` obligatoire pour chaque dimension ;
  - ajout ou retrait d'une dimension refusé (409) si des valeurs ou objectifs existent ;
  - `porteObjectifs` verrouillé dès qu'un objectif existe ;
  - verrous feuille-à-faits (§4, tour 3) ;
  - principal restreint (périmètre) : 403.

### 5.4 Sémantique de calcul (indicateurs multi-dimension)

Un indicateur **mono-dimension** emprunte le chemin historique, inchangé : `loadSousArbre`,
fonction par référentiel et D6. Ce chemin est vérifié par snapshot (§5.8).

Pour un indicateur **multi-dimension**, le graphe de cellules est calculé par
`dimension/buildGrapheCube.ts`, une fonction pure testée. Il est consommé **tel quel** par les
cœurs existants `resolveSerieIndividu` et `resolveObjectifIndividu`.

1. **Éclatement.** Pour une cellule `c`, on parcourt les dimensions dans l'ordre. La première
   coordonnée éclatable est éclatée. Une coordonnée est éclatable :
   - si son membre a des enfants **déclarés** et que la fonction de son niveau ≠ NONE ;
   - ou si elle est absente (racine virtuelle) avec une marginale ≠ NONE.

   La dimension d'ordre 0 est donc l'opération la plus **externe**. Exemple avec l'ordre
   Territoire puis Opérateur :
   - (NAT) éclate en (REG×18) ;
   - (REG) éclate en (DEPT…) ;
   - (DEPT) éclate en (DEPT, OP…).

   La marginale « tous opérateurs » d'un département se calcule ainsi comme un indicateur mono, et
   remonte la hiérarchie territoriale.

2. **Enfants déclarés les plus proches.** On saute les niveaux non déclarés : avec NAT + DEPT
   déclarés sans REG, NAT a pour enfants les DEPT. Les racines (enfants de la racine virtuelle) sont
   les membres sans ancêtre déclaré.
3. **Enfants attendus et couverture.** Les candidats sont les `c[d := enfant]`.
   - **Marginale pure** (aucune autre coordonnée fixée) : tous les candidats sont attendus. La
     hiérarchie fait foi, comme en mono : (NAT) attend ses 18 régions.
   - **Sinon** (cube creux) : seuls les candidats qui ont du **support** sont attendus. Un candidat a
     du support s'il existe un fait du même type (valeur pour les séries, objectif pour les
     objectifs) dans une cellule de son sous-cube, sur tout l'historique.

     Exemple : OP-REGIONAL absent du 13 n'est pas attendu dans (DEPT-13). La `couverture` reste
     « enfants avec valeur / enfants attendus ». Si aucun enfant n'est attendu, la cellule est une
     feuille.
4. **Valeurs : permissives.** Combinaison permissive des dernières valeurs connues (carry-forward,
   comme aujourd'hui). **Objectifs : stricts.**
5. **AVG et fonctions mixtes.** Le résultat est déterministe (l'ordre est persisté), mais **non
   commutatif**. Une tranche selon une autre dimension ne se recompose pas toujours en la marginale.
   Le chemin est exposé par `contributions`, c'est-à-dire les enfants de l'étape d'éclatement.
6. **Saisies.** En multi, on n'écrit que sur une **cellule feuille**. La valeur d'une cellule ne
   dépend donc jamais du chemin par lequel on l'atteint.

### 5.5 Coordonnée partielle

- Sur territoire × opérateur avec une marginale Opérateur en SUM, « DEPT-84 » est la marginale
  **dérivée** (tous opérateurs). On ne la saisit pas : `COORDONNEE_MANQUANTE`.
- Avec une marginale **NONE**, « DEPT-84 » est une feuille **inscriptible**, par exemple une union
  qui n'est pas une somme.
- Le « non ventilé » se représente par un membre feuille explicite d'une dimension non partagée.

### 5.6 Objectifs et taux de progression

- Les objectifs vivent sur le sous-cube des dimensions `porteObjectifs` ; ils se saisissent sur ses
  cellules feuilles.
- Le taux de la cellule `c` vaut valeur(`c`) / objectif(projection de `c` sur le sous-cube). Il
  n'existe que si les coordonnées de `c` **hors** sous-cube sont absentes.
- Exemple, avec des objectifs par territoire et des valeurs par territoire × opérateur :
  - taux(DEPT-84) = Σ opérateurs / objectif(DEPT-84) ;
  - taux(DEPT-84~OP-ORANGE) est absent, comme un individu sans objectif aujourd'hui.

### 5.7 Tranches, synthèse, carte, collections

- **Valeurs remarquables** `?referentiels=R&fixe=<cellule partielle>` : la population est la tranche
  « membres de R × fixe ». Sans `fixe`, ce sont les marginales.
- **Synthèse** : les pairs font varier la coordonnée de la première dimension présente (dans
  l'ordre) sur son niveau.
- **Carte** : la tranche territoriale, les autres coordonnées étant celles de la sélection.
- **Collections** : projection de la cellule par indicateur, en gardant les dimensions qu'il porte.
  Un indicateur est **non applicable** (`nonApplicable: true`, exclu de la moyenne) si la projection
  ne garde **aucune** coordonnée, alors que la collection contient un indicateur multi-dimension.
  Une collection 100 % mono garde la règle historique exacte (vérifié par snapshot).

### 5.8 Rétrocompatibilité

- Indicateur mono-dimension : chemin historique, sémantique gelée.
- Preuve : `scripts/poc-dimensions/snapshotLecture.ts` rejoue 785 requêtes de lecture sur le seed
  historique (valeurs, objectifs, taux, synthèse, valeurs remarquables, dernières valeurs,
  collections, référentiels…) et compare avec la capture faite avant tout changement. Résultat :
  - 733 réponses identiques ;
  - 52 réponses qui n'ont **que** des champs ajoutés (`dimensions` sur `/indicateurs`, `dimension` sur
    `/referentiels`) ;
  - 0 différence.
- pilote-ppg :
  - `valeurs:batch {individu,date,valeur}` est inchangé (erreurs comprises) ;
  - `PUT /indicateurs` avec `referentiels[]` fait un replace-all exact sur un indicateur mono.

### 5.9 Import Albert

- Le plan contient `colonneIndividu` et `colonnesIdentiteSupplementaires[]`. Chaque colonne
  d'identité est résolue **séparément**, contre les membres d'une seule dimension.
- La correspondance est indexée par (colonne, libellé). Une ligne non résolue ou partielle est
  écartée avec un avertissement.
- Les items produits sont `{individu: cellule, coordonnees, date, valeur}`.
- Layouts couverts : long et pivot (dates en colonnes).
- Hors scope : pivot sur des membres (opérateurs en colonnes) et lignes « Total ».

### 5.10 Cloisonnement

- `POST /permissions/indicateur {action: WRITE_DATA, perimetre: [...]}` pose atomiquement la
  restriction et le périmètre.
- Règles de contrôle :
  - ET entre dimensions, OU dans une dimension, descendants inclus ;
  - restreint sans ligne = aucune écriture.
- Le contrôle s'applique aux upsert, delete et batch (`HORS_PERIMETRE`, 403 en unitaire, par item en
  lot) et aux objectifs.
- Un principal restreint ne peut pas modifier la structure.
- `PUT /permissions` est différentiel ; le périmètre est exposé dans `/permissions` et
  `/me/permissions`.

### 5.11 Migration des données existantes

1. Union-find des référentiels, en reliant ceux qui sont liés par `Relation` **ou** co-déclarés sur
   un indicateur. Sur le seed, cela donne une seule dimension pour NAT/REG/DEPT, et
   DIM-EMPTY.
2. Une `indicateur_dimension` par indicateur (ordre 0, SUM, objectifs).
3. Une cellule mono par couple (indicateur, individu) qui a des faits.
4. Bascule `individu_id` → `cellule_id`.

## 6. Modèles écartés

- **M2 (tableau + TOUS).**
  - L'ordre de remontée est implicite (uuid).
  - Le membre TOUS est global et maintenu à la main, ce qui fausse le cube creux.
  - D6 jette les objectifs saisis sur TOUS.
  - Il n'y a pas de FK sur les éléments du tableau.
- **M3 (étoile à plat).**
  - Le mono change (AVG à plat, couverture comptée en feuilles).
  - Les fonctions par niveau sont perdues.
  - NULL est polysémique.
  - La limite est dure à 3 dimensions.
  - On en garde une idée pour l'avenir : l'agrégation SQL à plat comme optimisation des chemins
    100 % SUM.
- **M4 (ventilation).**
  - Il est plafonné à 2 axes et la ventilation n'a pas de hiérarchie.
  - La préséance est pilotée par les données.
  - C'est une impasse d'évolution.
- **M5 (composites).**
  - La topologie globale casse le mono.
  - Le DAG compte plusieurs fois.
  - Il demande 350 000 individus matérialisés au niveau des communes.

## 7. Choix de code transverse

Le brief §3.6 demande de documenter les options avant d'écrire du code transverse.

| Besoin                                       | Options                                                                                                                                | Choix                                                                                                                                                                                                                                                                           |
| -------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Réutiliser les cœurs existants pour le multi | (a) réécrire `resolveSerieIndividu` autour d'un type `Cellule` ; (b) produire, pour le multi, un graphe au **même format** que le mono | **(b)**. `buildGrapheCube` émet `enfantsParParent`, ainsi qu'une clé synthétique `referentielParIndividu(noeud)=noeud` et `fonctionAgregationParReferentiel(noeud)`. Diff minimal du cœur (la source d'une contribution est lue sur le point porté) et risque nul pour le mono. |
| Point d'entrée des lectures                  | (a) brancher chaque query ; (b) un chargeur unique `loadContexteSerie` / `loadContexteObjectif`                                        | **(b)**. Il fait l'aiguillage mono/multi en un seul endroit.                                                                                                                                                                                                                    |
| Erreurs de cellule en écriture               | (a) un type par commande ; (b) un type `ErreurCellule` partagé et un traducteur `erreurCelluleApi`                                     | **(b)**. Mêmes codes partout ; les détails gardent `individu` pour la forme historique.                                                                                                                                                                                         |
| Descriptions OpenAPI                         | (a) texte recopié par route ; (b) paragraphes partagés                                                                                 | **(b)** `dimension/descriptionsOpenApi.ts`, ajoutés en fin de description.                                                                                                                                                                                                      |
| Snapshot de non-régression                   | (a) clé API réelle et HTTP ; (b) app in-process dans une transaction annulée à la fin                                                  | **(b)**. Aucun secret, aucune trace en base.                                                                                                                                                                                                                                    |

## 8. Hors scope et limites connues

- **Volumétrie** : 35k communes × N membres. Le calcul se fait en JS, borné par le support. Il
  faudra pré-agréger en SQL (GROUP BY à plat sur les chemins SUM) ou matérialiser les marginales.
- **Support inféré**, non daté :
  - un opérateur parti reste compté via le carry-forward ;
  - l'arrivée d'un membre change la couverture historique ;
  - un retardataire qui n'a jamais saisi est invisible.

  Évolution possible : une table de présence déclarée et datée.

- **AVG et fonctions mixtes** non commutatifs : c'est assumé, et l'ordre est persisté.
- **Cloisonnement de la lecture** (secret statistique entre opérateurs), des commentaires et des
  niveaux de confiance.
- **Import** : pivot sur des membres, lignes « Total », coordonnées constantes (fichier
  mono-opérateur).
- **Éclatement d'un indicateur existant** (ajout de dimension sur un indicateur qui a des faits) :
  il faudrait une commande de migration explicite.
- **Scission d'une dimension** fusionnée par la migration, quand elle porte des faits.
- **Déploiement** : expand/contract sur `cellule_id`. Non nécessaire pour le POC.
- **Membres techniques dans un arbre partagé** : règle d'administration, sans garde automatique.
- **Collections** : la règle « non applicable » ne s'active que si la collection contient un indicateur multi-dimension. Ajouter un tel indicateur peut donc faire passer un autre indicateur de « null bloquant » à « exclu » (discontinuité assumée pour garder l'historique exact).
- **Héritées de l'existant**, non corrigées :
  - la création de commentaire ne vérifie pas le lien membre ↔ indicateur ;
  - `listObjectifsForIndicateur` annonce un filtre qu'il n'applique pas.

## 9. Questions produit ouvertes

1. **Collections d'opérateurs.** Faut-il garder la moyenne des taux par opérateur (pondérable)
   ou passer au taux de la somme (§10) ?
2. **Vue « opérateur » d'une collection mixte.** Aujourd'hui elle n'est souvent pas applicable :
   faut-il des objectifs par opérateur ?
3. **Fonctions mixtes.** Faut-il interdire les mélanges SUM/AVG entre dimensions ?
4. **Ordre canonique.** Faut-il recommander Territoire en ordre 0 ?
5. **Confidentialité entre opérateurs à la lecture.**
6. **Éclatement d'un indicateur existant.** Faut-il le permettre, au prix d'un nouvel
   identifiant ou d'une migration ?
7. **Membres « non ventilé ».** Faut-il une convention de nommage et une garde ?
8. **Pairs de la synthèse.** Faut-il garder la première dimension présente, ou rendre le choix
   paramétrable ?

## 10. Migration du contournement « collection d'opérateurs »

### 10.1 Exemple seedé

**Avant (contournement)** :
- un indicateur mono-territoire par opérateur, `IND-111` à `IND-115` (« Lignes fibre raccordées — <Opérateur> »), chacun avec ses objectifs au grain département ;
- la collection `COL-010` qui les regroupe (pondération 1).

**Après (dimension)** :
- `IND-101` « Lignes fibre raccordées », Territoire × Opérateur, avec les mêmes valeurs au grain (département, opérateur) ;
- un objectif par département égal à la somme des objectifs des opérateurs ;
- cube creux : OP-REGIONAL présent dans 10 départements seulement, OP-FREE absent des DROM.

Preuve, au dernier point 2026-06, obtenue avec `pnpm tsx scripts/poc-dimensions/comparerContournement.ts` :

| Cellule | Taux par opérateur (indicateurs séparés) | COL-010 (moyenne des taux) | IND-101 (taux de la somme) | Valeur IND-101 = Σ IND-111..115 |
|---|---|---|---|---|
| DEPT-29 | Orange 87,14 · SFR 83,05 · Free 100,00 (107,26 non plafonné) · Bouygues 75,41 · Régional 85,83 | 86,28 % | **87,40 %** (11 340 / 12 974) | 11 340 = 11 340 |
| DEPT-13 (sans régional) | … · Régional null | **null** (tout-ou-rien) | **87,30 %** | 32 986 = 32 986 |
| DEPT-974 (ni Free ni régional) | 2 opérateurs null | **null** | **82,74 %** | 28 808 = 28 808 |
| NAT-FR | Free et Régional : objectif national non dérivable (strict) | **null** | **86,07 %** (2 750 325 / 3 195 086) | 2 750 325 = 2 750 325 |

### 10.2 Ce qui change dans les chiffres

1. **Les valeurs sont identiques partout.** La marginale « tous opérateurs » est exactement la somme des indicateurs séparés. Le contournement, lui, ne savait pas calculer cette somme.
2. **Moyenne des taux et taux de la somme.** COL-010 donne le même poids à chaque opérateur. IND-101 revient à pondérer chaque opérateur par son objectif : Orange pèse environ 33 % de la cible du 29, le régional environ 11 %. Sur le 29, on obtient 86,28 % d'un côté et 87,40 % de l'autre.
3. **Le plafond à 100 % ne s'applique plus par opérateur.** Dans la collection, l'avance de Free (107 %) est perdue. Dans la somme, elle compense le retard des autres. Même sans plafond, la moyenne (87,74 %) resterait différente, à cause des poids.
4. **Le cube creux ne rend plus la vue null.** Un opérateur absent d'un territoire suffisait à rendre COL-010 null (règle tout-ou-rien). La pondération 0 ne contournait ce problème que pour toute la collection à la fois. IND-101 calcule un taux partout.
5. **Objectifs stricts au national.** Free et le régional n'ont pas d'objectif national, puisqu'ils sont absents de certains départements. COL-010 est donc null au national, alors qu'IND-101 garde un objectif territorial complet.
6. **Ce qui se perd :**
   - les **pondérations** par opérateur, qui n'ont plus de place (question produit §9.1) ;
   - le **cloisonnement en lecture** par indicateur, auparavant implicite : un opérateur voit désormais la marginale (§8).

   Le cloisonnement en écriture est conservé (§5.10).
