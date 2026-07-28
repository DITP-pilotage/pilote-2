# Gaps entre régions bakés dans le GeoJSON — carte France

## Contexte

La branche `feat/carte-france-stylisee-petite-couronne` convertit les SVG ppg en
GeoJSON stylisé (petite couronne visible) via
`src/scripts/svgVersGeoJson.ts` → `src/scripts/genererGeoJsonFrance.ts` →
`public/maps/france-departements.json` / `france-regions.json`, affichés par
`CarteFrance.tsx` (`echarts.registerMap`).

Les bordures blanches actuelles sont un `itemStyle.borderWidth: 1.5` uniforme
appliqué entre **toutes** les zones. On veut à la place **marquer les frontières
entre régions** : un espacement plus large entre régions, notamment sur la carte
des départements, en incluant cet espacement dans la **géométrie GeoJSON** plutôt
que dans la config echarts.

## Objectif

- Sur la carte des départements : les départements d'une même région restent
  jointifs (distingués par un liseré fin), et un **gap visible** apparaît entre
  régions.
- Sur la carte des régions : même traitement pour cohérence (chaque région
  contractée vers son propre centre).
- L'espacement inter-régions vit dans le GeoJSON généré, pas dans echarts.

## Donnée clé

`apps/pilote-ppg/src/client/constants/territoires.json` fournit `codeParent` sur
chaque département (`DEPT-08 → REG-44`), d'où le mapping département → région
nécessaire pour grouper.

## Mécanisme

Contraction affine par groupe : pour chaque groupe (région), on calcule le
**centre de la bounding box** de l'union de ses polygones, puis on applique
`p' = centre + facteur·(p − centre)` à tous les anneaux de tous les polygones du
groupe.

Propriétés :
- Transformation affine à centre commun ⇒ les arêtes partagées entre départements
  d'un même groupe sont préservées (départements restent jointifs).
- Groupes distincts contractés vers des centres distincts ⇒ un gap apparaît entre
  eux.
- La petite couronne (toute en IdF) est contractée d'un bloc ⇒ arrangement
  préservé.

Facteur de départ : **0.95** pour les deux cartes (constante en tête de script, à
affiner visuellement).

## Composants

### 1. `src/scripts/contracterGeoJson.ts` (nouveau, pur, testé)

```
contracterGeoJson({ collection, groupePar, facteur }): GeoJsonFeatureCollection
```
- `collection: GeoJsonFeatureCollection`
- `groupePar: (feature) => string` — clé de groupe
- `facteur: number` — ex. 0.95
- Réutilise les types `GeoJsonFeatureCollection` / `GeoJsonGeometry` de
  `svgVersGeoJson.ts`.
- Ne mute pas l'entrée ; renvoie une nouvelle collection.

### 2. `src/scripts/genererGeoJsonFrance.ts` (câblage)

- Charge `codeParent` depuis `territoires.json` → `regionParDept: Record<string,string>`.
- Après `convertirSvgEnGeoJson`, applique `contracterGeoJson` :
  - départements : `groupePar = f => regionParDept[f.properties.code]` (throw si absent)
  - régions : `groupePar = f => f.properties.code`
- Puis `franceGeoJsonSchema.parse` (déjà en place) et écriture.

### 3. `src/components/widgets/CarteFrance.tsx`

- Le liseré itemStyle change de rôle : de « séparer toutes les zones » à
  « distinguer les départements au sein d'une région ».
- `borderColor: '#ffffff'`, `borderWidth: 0.5`.
- La séparation entre régions vient du gap GeoJSON (le fond transparaît).

## Tests

`src/scripts/contracterGeoJson.test.ts` :
- Deux features de groupes différents, adjacentes → après contraction, leurs
  arêtes ne se touchent plus (gap).
- Deux features d'un même groupe partageant une arête → arête toujours partagée
  après contraction (mêmes coordonnées transformées).
- Immutabilité : la collection d'entrée n'est pas modifiée.

## Livrable

- Régénérer les deux `.json` via `pnpm maps:generate`.
- `pnpm test`, `pnpm lint` verts.
- Vérification visuelle via l'app.

## Hors scope

- Pas de changement de l'API / des données métier.
- Pas de configuration runtime du facteur (constante de génération).
