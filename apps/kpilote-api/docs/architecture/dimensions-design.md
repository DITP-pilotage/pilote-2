# Dimensions d'observation : l'individu devient une dimension comme une autre

Date : 2026-11-02
Statut : POC (branche `claude/individu-dimension-poc-f01d87`, non poussée)
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

| Terme | Définition |
|---|---|
| **Dimension** | Axe d'observation nommé (Territoire, Opérateur, Type de fraude). Entité en base. |
| **Niveau** | Un référentiel. Chaque référentiel appartient à une dimension. REF-NAT, REF-REG et REF-DEPT sont trois niveaux de la dimension Territoire. |
| **Membre** | Un individu. Son niveau (référentiel) détermine sa dimension. |
| **Coordonnée** | Un couple (dimension, membre). |
| **Cellule** | Un ensemble de coordonnées, au plus une par dimension. Une cellule est **complète** pour un indicateur si elle porte une coordonnée sur chacune de ses dimensions, **partielle** sinon. |
| **Marginale** | Une cellule partielle, lue comme « tous » sur les dimensions absentes. Exemple : DEPT-84, tous opérateurs. |
| **Tranche** | L'ensemble des cellules où une dimension varie (sur un niveau) et où les autres coordonnées sont fixées. |

---

## 2. Modèles étudiés

Chaque modèle répond aux 10 questions du brief (§3.2) :

| # | Question |
|---|---|
| Q1 | Identité et unicité |
| Q2 | Ce qu'un indicateur déclare |
| Q3 | Coordonnée partielle |
| Q4 | Agrégation multi-axes |
| Q5 | Cube creux et couverture |
| Q6 | Tranches de comparaison et carte |
| Q7 | Grain des objectifs et taux de progression |
| Q8 | Permissions |
| Q9 | Rétrocompatibilité |
| Q10 | Volumétrie et complexité UI |

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

Légende : ✅ bon · ⚠️ compromis · ❌ rédhibitoire.

| Critère | M1 Cellule | M2 Tableau + TOUS | M3 Étoile | M4 Ventilation | M5 Composites |
|---|---|---|---|---|---|
| Dimensions arbitraires (N) | ✅ | ✅ | ⚠️ 3 max | ❌ 2 max | ✅ |
| Intégrité FK des coordonnées | ✅ | ❌ trigger | ✅ | ✅ | ✅ |
| Sémantique d'agrégation non ambiguë | ✅ ordre déclaré | ⚠️ ordre implicite | ✅ à plat | ✅ fixe | ❌ double comptage |
| AVG mono-dimension identique | ✅ | ✅ | ❌ | ✅ | ✅ |
| Cube creux / couverture juste | ✅ support | ⚠️ manquantes parasites | ⚠️ couverture redéfinie | ✅ | ✅ |
| Objectif à grain grossier | ✅ sous-cube | ❌ exception D6 | ✅ | ✅ | ❌ |
| Cloisonnement par membre | ✅ | ✅ | ✅ | ✅ | ❌ |
| Rétrocompatibilité mono-dimension | ✅ | ✅ | ⚠️ AVG | ✅ | ✅ |
| Configuration en base, sans maintenance manuelle | ✅ | ❌ membres TOUS | ✅ | ✅ | ❌ composites |
| Volumétrie (35k × N) | ⚠️ JS, borné par le support | ⚠️ | ✅ SQL | ⚠️ | ❌ |
| Coût d'implémentation POC | ⚠️ élevé | ⚠️ | ⚠️ réécriture moteur | ✅ faible | ✅ faible |

(Matrice provisoire, avant challenge : voir §4.)
