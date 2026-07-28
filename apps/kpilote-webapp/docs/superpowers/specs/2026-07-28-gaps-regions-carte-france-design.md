# Marquer les frontières entre régions sur la carte France

## Contexte

La branche `feat/carte-france-stylisee-petite-couronne` convertit les SVG ppg en
GeoJSON stylisé (petite couronne visible) via
`src/scripts/svgVersGeoJson.ts` → `src/scripts/genererGeoJsonFrance.ts` →
`public/maps/france-departements.json` / `france-regions.json`, affichés par
`CarteFrance.tsx` (`echarts.registerMap`).

On veut **marquer les frontières entre régions** : un trait épais et de largeur
**uniforme** entre régions, notamment sur la carte des départements, tout en
gardant un liseré fin entre départements d'une même région.

## Approche écartée : contraction des régions

Première tentative : contracter chaque groupe de départements vers son centre
pour créer un gap baké dans le GeoJSON. Rejetée car l'espacement obtenu n'est
**pas uniforme** (il dépend de la distance bord → centre de chaque région).

## Approche retenue : overlay de frontières dérivé des départements

On superpose au choroplèthe un second calque (série `map` echarts) qui ne dessine
que les **contours de régions**, en trait épais uniforme.

Point clé : la carte régions SVG **ne s'aligne pas** avec la carte départements
sur la petite couronne (dans les départements, la petite couronne est explosée en
médaillon ; dans les régions, l'IdF reste compacte). On ne peut donc pas
superposer `france-regions.json` tel quel sur la carte départements.

Solution : dériver les contours de régions **depuis la géométrie des
départements** (qui contient le médaillon), par **parité d'arêtes** :

- Une arête interne à une région (partagée par deux départements de cette région)
  apparaît un nombre pair de fois → elle s'annule.
- Les arêtes restantes (nombre impair) forment la frontière de la région.
- Ces arêtes sont recollées en anneaux fermés (contour dissous = union des
  départements de la région).

Prérequis vérifié : dans le SVG départements, ~63 % des arêtes sont partagées
exactement entre départements adjacents (subdivision planaire propre), ce qui rend
la parité d'arêtes fiable.

## Composants

### 1. `src/scripts/frontieresRegions.ts` (nouveau, pur, testé)

```
construireFrontieresRegions({ departements, regionDe, nomRegion }): GeoJsonFeatureCollection
```

- Groupe les départements par région, calcule le contour dissous (parité d'arêtes
  - recollement en anneaux), renvoie une feature `MultiPolygon` par région.

### 2. `src/scripts/genererGeoJsonFrance.ts`

- Génère `france-departements.json` et `france-regions.json` bruts (sans
  contraction).
- Génère en plus `france-departements-frontieres.json` via
  `construireFrontieresRegions` (contours alignés sur la carte départements).

### 3. `src/components/widgets/CarteFrance.tsx`

- Prop optionnelle `frontieres?: FranceGeoJson`.
- Quand fournie : enregistre une seconde carte `${mapName}__frontieres` et ajoute
  une série `map` silencieuse (fond transparent, bordure blanche épaisse ~2.4),
  avec le **même cadrage** (`aspectScale` / `layoutCenter` / `layoutSize`) que le
  choroplèthe pour une superposition exacte.
- `visualMap.seriesIndex: 0` pour que seul le choroplèthe soit coloré.
- Base : liseré fin `borderWidth: 0.5` (distinction des départements).

### 4. Câblage widget (imports statiques)

Les cartes sont générées dans `src/assets/maps/*.json` et **importées
statiquement** (pas de fetch runtime) : le code splitting par route les place dans
le chunk de la route, elles sont déjà validées à la génération.

- `src/assets/maps/index.ts` : importe les trois JSON et les expose typés
  `FranceGeoJson`.
- `WidgetRenderer` passe les objets en props :
  - carte départements → `geoJson` = départements, `frontieres` =
    `france-departements-frontieres`.
  - carte régions → `geoJson` = régions, `frontieres` = régions (contours des
    régions eux-mêmes), qui s'aligne trivialement avec le choroplèthe.
- `CarteFranceWidget` reçoit `geoJson`/`frontieres` en props ; il ne garde en
  `useSuspenseQueries` que les données métier (individus, valeurs remarquables).
- `api/geoJson.ts` ne conserve que le schéma/type ; `queries/geoJson.ts` est
  supprimé.

## Tests

`src/scripts/frontieresRegions.test.ts` : dissolution des arêtes internes, un
contour par région, anneau fermé, conformité au schéma de l'app.

## Livrable

- `pnpm maps:generate` régénère les trois `.json`.
- `pnpm test`, `pnpm lint` verts.
- Vérification visuelle via l'app.

## Hors scope

- Pas de changement de l'API / des données métier.
- Pas de configuration runtime de l'épaisseur (constante côté composant).
