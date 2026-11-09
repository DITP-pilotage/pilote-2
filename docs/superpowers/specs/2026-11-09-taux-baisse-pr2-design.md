# Taux de progression des indicateurs à la baisse (PR2) — design

Date : 2026-11-09
Tickets : PIL-1778 (règle « afficher le taux de PIL-1777 lorsqu'il est demandé et calculable, sinon conserver valeurs et cibles »), epic PIL-1775
Périmètre : `apps/kpilote-api`, `packages/kpilote-shared`, `apps/kpilote-webapp`
Branche proposée : `feat/PIL-1778-taux-baisse`, ouverte depuis `feat/PIL-1776-sens-souhaite`. PR stackée sur #2655, elle-même stackée sur #2657.

## Objectif

Depuis la PR1 (#2655), un indicateur porte un sens souhaité, `HAUSSE` ou `BAISSE`. Le taux de progression actuel, `min(100, VA / VC × 100)`, n'a de sens que pour un indicateur à la hausse : pour un chômage à 10 % visé à 7 %, il afficherait 100 %. Le calcul propre aux indicateurs à la baisse, avec une valeur initiale, fera l'objet de PIL-1777, encore en refinement.

En attendant, cette PR :

1. **ne calcule plus de taux pour un indicateur à la baisse** : `tauxProgression` vaut `null`, et la valeur et la cible restent fournies ;
2. **garde la cible visible quand il n'y a pas de taux** : le bloc « Progression » reste affiché avec « — » à la place du pourcentage, sans barre, et l'objectif en dessous. La règle vaut pour tous les cas sans taux, y compris le cas actuel d'une cible à 0.

Elle ne change ni les couleurs, ni la variation, ni la médiane. C'est le rôle de la PR3.

## Place dans le chantier

1. PR1 (#2655) : le sens souhaité, stocké, exposé, saisi et affiché.
2. **PR2 (ce document)** : neutraliser le taux à la baisse et afficher la cible sans taux.
3. PR3 : interpréter les valeurs selon le sens dans la webapp.

Les trois PR sont mergées sur `dev` avant le prochain déploiement en prod.

## Décisions

1. **Un seul point de neutralisation.** Tous les taux passent par `computeTauxProgressionPoints`, qui a quatre appelants : la courbe de la fiche, les cartes d'indicateurs, le détail d'une collection et les cartes de collections. La règle « `BAISSE` → `tauxProgression: null` » vit dans la fonction pure `resolveTauxProgression`. PIL-1777 la remplacera par le calcul avec la valeur initiale.
2. **Les points restent renvoyés.** Pour un indicateur à la baisse, chaque point garde `valeur`, `valeurCible` et `dateCible`, avec `tauxProgression: null`. La courbe garde donc sa série « Objectif », et la cible reste affichable.
3. **Le contrat de l'API ne change pas.** Aucun champ n'est ajouté ni retiré. Seules les descriptions de `tauxProgression` évoluent.
4. **Les collections gardent la règle tout-ou-rien** (décision de Triko, cohérente avec PIL-1578). Un indicateur à la baisse avec une pondération supérieure à 0 rend la collection sans taux. Avec une pondération à 0, il est ignoré comme aujourd'hui. Aucune exclusion automatique.
5. **Bloc « Progression » sans taux, variante C1** (décision de Triko) : le titre « Progression », « — » à la place du pourcentage, pas de barre, puis l'objectif et sa date. Aucune raison n'est affichée. Une barre vide se lirait « 0 % », ce qui serait faux pour un indicateur à la baisse qui progresse.
6. **Le bloc n'apparaît que s'il y a un objectif et au moins une valeur.** Concrètement, il faut qu'un point de taux existe. `resolveTauxProgression` part des valeurs et saute un individu sans objectif. Sans objectif, ou avec un objectif mais aucune valeur, rien ne change et aucun bloc n'est affiché. Rendre visible un objectif sans valeur est hors périmètre (*choix de Claude, après relecture*).
7. **Cartes de collections : « Progression — » quand le taux est vide** (*choix de Claude, non contredit*). L'API des cartes ne renvoie que le taux et ne distingue pas une collection vide d'une collection bloquée : une collection vide affichera donc aussi « Progression — ». Pas de champ supplémentaire dans l'API pour l'éviter.
8. **La légende du détail d'une collection ne compte que les contributions pondérées** (*choix de Claude*). C'est un défaut existant que les indicateurs à la baisse rendraient plus visible : aujourd'hui, la légende compte aussi les contributions à pondération 0, que le calcul ignore.

## API (`apps/kpilote-api/src`)

### Règle pure : `valeurAvancement/resolveTauxProgression.ts`

- `resolveTauxProgression` reçoit en plus `sensSouhaite: SensSouhaite` (type de `@pilote/kpilote-shared/indicateur`).
- Pour `BAISSE`, chaque point est construit comme aujourd'hui (même objectif applicable, même `valeurCible` et même `dateCible`), avec `tauxProgression: null`.
- Pour `HAUSSE`, rien ne change : `computeTaux` comme aujourd'hui, `null` si la cible vaut 0.

### Pipeline : `valeurAvancement/queries/computeTauxProgressionPoints.ts`

- Le paramètre d'entrée gagne `sensSouhaite: SensSouhaite`, qui est transmis à `resolveTauxProgression`.
- Pas de requête supplémentaire : chaque appelant fournit le sens qu'il lit déjà en base.

### Appelants : ajouter `sensSouhaite` au `select` de l'indicateur et le transmettre

| Fichier | Lecture actuelle de l'indicateur |
|---|---|
| `valeurAvancement/queries/listTauxProgressionForIndicateur.ts` | `findFirstOrThrow … select: { id: true, publicId: true }` (l. 32) |
| `valeurAvancement/queries/listTauxProgressionForIndividu.ts` | `findMany … select: { id: true, publicId: true }` |
| `collection/queries/getCollectionTauxProgression.ts` | `indicateurs.select.indicateur: { select: { id, publicId } }` ; le helper local `computeDernierTaux({ indicateurId, cible })` (l. 131) reçoit aussi `sensSouhaite` |
| `collection/queries/listCollectionTauxProgressionForIndividu.ts` + `computeCollectionContributions.ts` | `indicateur: { select: { id, publicId } }`, type `CollectionIndicateurRef` |

`resolveCollectionTauxProgression` ne change pas : la règle tout-ou-rien s'applique d'elle-même, puisqu'une contribution à la baisse arrive avec un taux `null`.

## Schémas partagés (`packages/kpilote-shared/src`)

Les descriptions seules changent. Aucun champ n'est modifié.

- `tauxProgression.ts`, `tauxProgressionPointApiModelSchema.tauxProgression` : « … null si valeurCible vaut 0 **ou si l'indicateur est à la baisse (sensSouhaite = BAISSE) : le calcul propre à ces indicateurs n'existe pas encore** ».
- `valeurAvancement.ts`, réponse des cartes d'indicateurs :
  - `tauxProgressionIndividuApiModelSchema.tauxProgression` : même mention. Retirer au passage « null si aucun objectif », qui est faux : sans objectif, l'item est omis ;
  - description de `tauxProgressionIndividuListApiModelSchema.items` (l. 503-507) : ajouter le cas « à la baisse » aux cas où le taux vaut `null`.
- `collectionTauxProgression.ts` :
  - champ `tauxProgression` des contributions : même mention ;
  - taux des cartes de collections et du détail d'une collection : préciser qu'un indicateur à la baisse pondéré rend la collection non calculable (tout-ou-rien).
- Descriptions des routes qui décrivent les cas `null` : `apps/kpilote-api/src/valeurAvancement/routes.ts` (l. 352-357, 382-386, 410-415) et `apps/kpilote-api/src/collection/routes.ts` (l. 148-153). Elles reçoivent la même mention.

## Webapp (`apps/kpilote-webapp/src/components`)

### `indicateurs/IndicateurProgression.tsx`

- `taux: number | null`, au lieu de `number`.
- Avec `taux === null` :
  - le titre « Progression » reste ;
  - « — » remplace le pourcentage, avec un texte accessible « Progression non disponible » ;
  - **pas de `ProgressBar`** ;
  - « Objectif : {valeurCible + unité} » et la date sont affichés comme aujourd'hui.
- Avec un taux, rien ne change.

Rendu attendu, variante C1 :

```
PROGRESSION                    —
                 Objectif : 7 %
                        01/2027
```

### `indicateurs/IndicateurSynthesePanel.tsx` (panneau de la fiche)

- Condition d'affichage : `dernierPoint` existe, au lieu de `taux !== null && dernierPoint`.
- Passer `taux` tel quel (`number | null`).

### `indicateurs/IndicateurAvancement.tsx` (cartes d'indicateurs)

- Condition d'affichage : `tauxData != null`, c'est-à-dire qu'un item existe pour cet indicateur et cet individu, au lieu de `tauxData?.tauxProgression != null`.
- Passer `tauxData.tauxProgression` tel quel.

### `collections/CollectionAvancement.tsx` (cartes de collections)

- `data == null` : pas de bloc, comme aujourd'hui.
- `data.tauxProgression == null` : le titre « Progression » et « — » avec le texte accessible « Progression de la collection non disponible ». Pas de barre et pas de ligne d'objectif, puisqu'une collection n'en a pas.
- Avec un taux, rien ne change.

### `collections/CollectionTauxProgression.tsx` (détail d'une collection) : `buildCaption`

- Les contributions pondérées sont celles dont la `ponderation` est supérieure à 0.
- Les cas :
  - taux présent : « Moyenne pondérée des indicateurs », sans changement ;
  - aucune contribution : « Collection sans indicateur », sans changement ;
  - des contributions, mais aucune pondérée : « Aucun indicateur pondéré » ;
  - sinon : « {n}/{m} indicateur(s) sans taux », où n compte les contributions pondérées sans taux et m les contributions pondérées.

### Ce qui ne change pas

- `IndicateurValeursChart` : la série « Objectif » reste, et la ligne « Taux de progression » de l'infobulle est déjà omise quand le taux est `null`.
- La valeur affichée dans le `StatCard` du détail d'une collection (« — » quand le taux est vide).

## Tests

Tests d'intégration côté API seulement, dans les fichiers existants. Aucun test côté client : les composants concernés n'en ont pas.

Préparation des fixtures (*choix de Claude*) :
- ajouter `sensSouhaite: SensSouhaite` au type `IndicateurOverrides` de `apps/kpilote-api/src/test/fixtures.ts` (l. 53-67), pour créer un indicateur à la baisse par fixture ;
- pour la pondération 0, la fixture `collection` laisse le défaut (1) : mettre la pondération à jour par un `db().collectionIndicateur.update` direct dans le test.

- **`valeurAvancement/queries/listTauxProgressionForIndicateur.test.ts`** : un indicateur à la baisse avec une valeur et un objectif renvoie ses points avec `tauxProgression: null`, et la `valeur`, la `valeurCible` et la `dateCible` attendues.
- **`valeurAvancement/queries/listTauxProgressionForIndividu.test.ts`** : même vérification sur la réponse des cartes. L'item est présent, avec `tauxProgression: null`, et la `valeurCible` et la `dateCible` attendues.
- **`collection/queries/getCollectionTauxProgression.test.ts`** :
  - une collection avec un indicateur à la hausse calculable et un indicateur à la baisse, tous deux pondérés à 1, renvoie `tauxProgression: null`, et la contribution à la baisse a un taux `null`. Ce test fige le tout-ou-rien ;
  - la même collection, avec l'indicateur à la baisse à pondération 0, renvoie le taux de l'indicateur à la hausse.

Les tests existants de `resolveCollectionTauxProgression` et des endpoints ne doivent pas changer de résultat pour les indicateurs à la hausse.

## Documentation

`apps/kpilote-api/docs/architecture/taux-progression.md` : ajouter une section courte, « Indicateurs à la baisse ». Elle dit que le taux vaut `null` en attendant PIL-1777, que les points gardent valeur et cible, et que la règle tout-ou-rien des collections s'applique.

## Recette

- **Dans le seed, COL-005 contient IND-001**, passé à la baisse par la PR1. Après cette PR, COL-005 affichera « — » et « 1/n indicateur sans taux » : c'est la conséquence attendue du tout-ou-rien, et elle permet de le montrer en démo. On ne change pas le seed.
- **Pour voir le bloc « Progression — »**, ouvrir IND-001 ou IND-004 sur un individu qui a un objectif : ces deux indicateurs sont à la baisse et ont des objectifs dans le seed.

## Laissé au développeur

- La forme exacte du texte accessible du « — » (`aria-label` ou texte masqué).
- La mise en page fine du bloc sans barre (espacements), tant qu'elle suit la variante C1.

## Hors périmètre

- Le calcul du taux à la baisse avec une valeur initiale (PIL-1777).
- L'interprétation selon le sens : couleurs, variation, min et max, médiane (PR3).
- Tout affichage de la raison de l'absence de taux.
- Un champ d'API pour distinguer une collection vide d'une collection non calculable.
