# Carte France stylisée (visibilité petite couronne) — Plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remplacer les GeoJSON de la carte kpilote par une version stylisée convertie depuis les SVG ppg, où l'Île-de-France est agrandie et la petite couronne (75/92/93/94) redevient visible et cliquable.

**Architecture:** Un module de conversion pur (SVG stylisé → GeoJSON, inversion de l'axe Y, aucune projection géographique) testé unitairement ; un script CLI qui lit les SVG ppg + les noms de territoires et régénère les deux fichiers `public/maps/*.json` ; un ajustement d'`aspectScale` dans le composant ECharts partagé.

**Tech Stack:** TypeScript, Vitest, `svgpath` (parsing des paths), `tsx` (exécution du script), Zod (validation de sortie), ECharts.

## Global Constraints

- **Named exports/imports uniquement** (pas de default export applicatif ; `svgpath` a un default export côté lib, importé tel quel).
- **L'utilisateur lance lui-même** `pnpm install`, `pnpm test`, `pnpm run maps:generate`, `pnpm lint`. Les steps « run » demandent à l'utilisateur d'exécuter et de rapporter le résultat.
- **pnpm** comme package manager ; monorepo pnpm workspace (le repo refuse toute dépendance publiée il y a moins de 2 semaines — `svgpath` et `tsx` sont anciens, OK).
- **Codes cible identiques aux existants** : `DEPT-XX` → `XX`, `REG-XX` → `XX` (INSEE). 101 features départements, 18 features régions.
- **Contrat de sortie (Zod)** : chaque Feature a `properties: { code: string, nom: string }` (requis) et une `geometry` Polygon/MultiPolygon. `nom` vient de `apps/pilote-ppg/src/client/constants/territoires.json` (`nomAffiché`).
- **Filtrage par préfixe** : le SVG départements contient aussi `REG-*`/`NAT-FR` ; le SVG régions contient aussi `DEPT-*`. Ne garder que le préfixe cible.
- **Inversion Y obligatoire** : `y' = maxY - y` (SVG descend, GeoJSON monte).
- Fichiers modifiés/créés **sous `apps/kpilote-webapp/`** uniquement ; ppg est source en lecture seule.

---

### Task 1 : Module de conversion pur + validation

**Files:**
- Create: `apps/kpilote-webapp/src/scripts/svgpath.d.ts`
- Create: `apps/kpilote-webapp/src/scripts/svgVersGeoJson.ts`
- Create: `apps/kpilote-webapp/src/scripts/svgVersGeoJson.test.ts`
- Modify: `apps/kpilote-webapp/src/api/geoJson.ts` (exporter `franceGeoJsonSchema`)
- Modify: `apps/kpilote-webapp/package.json` (devDeps `svgpath`, `tsx`)

**Interfaces:**
- Produces: `convertirSvgEnGeoJson({ svg: string, prefixe: string, maxY: number, nomsParCode: Record<string, string> }): GeoJsonFeatureCollection` et les types `GeoJsonFeatureCollection`, `GeoJsonFeature`, `GeoJsonGeometry`.
- Produces: `franceGeoJsonSchema` exporté depuis `src/api/geoJson.ts`.

- [ ] **Step 1 : Ajouter les dépendances de dev**

Éditer `apps/kpilote-webapp/package.json`, section `devDependencies`, ajouter (garder l'ordre alphabétique) :

```json
"svgpath": "^2.6.0",
"tsx": "^4.19.2",
```

Demander à l'utilisateur de lancer `pnpm install` (depuis `apps/kpilote-webapp`) et de confirmer que l'installation réussit.

- [ ] **Step 2 : Déclaration de types minimale pour `svgpath`**

`svgpath` ne fournit pas de types et `@types/svgpath` n'existe pas. Créer `apps/kpilote-webapp/src/scripts/svgpath.d.ts` :

```ts
declare module 'svgpath' {
  type Segment = [string, ...number[]]

  interface SvgPath {
    abs(): SvgPath
    rel(): SvgPath
    unshort(): SvgPath
    unarc(): SvgPath
    iterate(
      callback: (segment: Segment, index: number, lastX: number, lastY: number) => void,
    ): SvgPath
  }

  export default function svgpath(path: string): SvgPath
}
```

- [ ] **Step 3 : Exporter le schéma Zod existant**

Dans `apps/kpilote-webapp/src/api/geoJson.ts`, ajouter `export` devant la déclaration du schéma :

```ts
export const franceGeoJsonSchema = z.object({
  type: z.literal('FeatureCollection'),
  features: z.array(geoJsonFeatureSchema).readonly(),
})
```

(Seul le mot-clé `export` est ajouté ; le reste du fichier est inchangé.)

- [ ] **Step 4 : Écrire les tests (qui échouent)**

Créer `apps/kpilote-webapp/src/scripts/svgVersGeoJson.test.ts` :

```ts
import { describe, expect, it } from 'vitest'

import { franceGeoJsonSchema } from '@/api/geoJson'
import { convertirSvgEnGeoJson, type GeoJsonGeometry } from '@/scripts/svgVersGeoJson'

const svgFake = `
<svg viewBox="0 0 10 10">
  <path d="M1,1 3,1 3,3 1,3z" territoire-code="DEPT-01"/>
  <path d="M5,5 7,5 7,7z M8,8 9,8 9,9z" territoire-code="DEPT-13"/>
  <path d="M0,0 10,0 10,10z" territoire-code="REG-11"/>
</svg>`

const nomsParCode = {
  'DEPT-01': 'Ain',
  'DEPT-13': 'Bouches-du-Rhône',
  'REG-11': 'Île-de-France',
}

const polygone = (geometry: GeoJsonGeometry): number[][][] => {
  if (geometry.type !== 'Polygon') throw new Error('Polygon attendu')
  return geometry.coordinates
}

describe('convertirSvgEnGeoJson', () => {
  it('ne garde que les paths du préfixe demandé', () => {
    const result = convertirSvgEnGeoJson({ svg: svgFake, prefixe: 'DEPT-', maxY: 10, nomsParCode })
    expect(result.features.map((feature) => feature.properties.code)).toEqual(['01', '13'])
  })

  it('retire le préfixe du code et joint le nom', () => {
    const result = convertirSvgEnGeoJson({ svg: svgFake, prefixe: 'DEPT-', maxY: 10, nomsParCode })
    expect(result.features[0].properties).toEqual({ code: '01', nom: 'Ain' })
  })

  it('inverse l’axe Y (y devient maxY - y)', () => {
    const result = convertirSvgEnGeoJson({ svg: svgFake, prefixe: 'DEPT-', maxY: 10, nomsParCode })
    expect(polygone(result.features[0].geometry)[0][0]).toEqual([1, 9])
  })

  it('produit un MultiPolygon pour les paths à plusieurs sous-chemins', () => {
    const result = convertirSvgEnGeoJson({ svg: svgFake, prefixe: 'DEPT-', maxY: 10, nomsParCode })
    expect(result.features[1].geometry.type).toBe('MultiPolygon')
  })

  it('ferme chaque anneau (premier point = dernier point)', () => {
    const result = convertirSvgEnGeoJson({ svg: svgFake, prefixe: 'DEPT-', maxY: 10, nomsParCode })
    const anneau = polygone(result.features[0].geometry)[0]
    expect(anneau[0]).toEqual(anneau[anneau.length - 1])
  })

  it('produit un GeoJSON conforme au schéma de l’app', () => {
    const result = convertirSvgEnGeoJson({ svg: svgFake, prefixe: 'DEPT-', maxY: 10, nomsParCode })
    expect(() => franceGeoJsonSchema.parse(result)).not.toThrow()
  })

  it('échoue si un nom est manquant', () => {
    expect(() =>
      convertirSvgEnGeoJson({ svg: svgFake, prefixe: 'DEPT-', maxY: 10, nomsParCode: {} }),
    ).toThrow(/Nom introuvable/)
  })
})
```

- [ ] **Step 5 : Vérifier que les tests échouent**

Demander à l'utilisateur de lancer :
`pnpm test svgVersGeoJson`
Attendu : ÉCHEC — module `@/scripts/svgVersGeoJson` introuvable.

- [ ] **Step 6 : Implémenter le module de conversion**

Créer `apps/kpilote-webapp/src/scripts/svgVersGeoJson.ts` :

```ts
import svgpath from 'svgpath'

type Point = [number, number]
type Ring = Point[]

export type GeoJsonGeometry =
  | { type: 'Polygon'; coordinates: Ring[] }
  | { type: 'MultiPolygon'; coordinates: Ring[][] }

export type GeoJsonFeature = {
  type: 'Feature'
  properties: { code: string; nom: string }
  geometry: GeoJsonGeometry
}

export type GeoJsonFeatureCollection = {
  type: 'FeatureCollection'
  features: GeoJsonFeature[]
}

const PRECISION = 4

const arrondir = (valeur: number): number => Number(valeur.toFixed(PRECISION))

const echantillonnerCubique = (p0: Point, p1: Point, p2: Point, p3: Point): Point[] => {
  const points: Point[] = []
  const segments = 8
  for (let index = 1; index <= segments; index += 1) {
    const t = index / segments
    const u = 1 - t
    const x = u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0]
    const y = u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1]
    points.push([x, y])
  }
  return points
}

const extrairePaths = (svg: string): Array<{ code: string; d: string }> => {
  const balises = svg.match(/<path\b[^>]*>/g) ?? []
  const paths: Array<{ code: string; d: string }> = []
  for (const balise of balises) {
    const d = balise.match(/\bd="([^"]*)"/)?.[1]
    const code = balise.match(/territoire-code="([^"]*)"/)?.[1]
    if (d && code) paths.push({ code, d })
  }
  return paths
}

const pathVersAnneaux = (d: string): Ring[] => {
  const anneaux: Ring[] = []
  let anneau: Ring = []
  svgpath(d)
    .abs()
    .unshort()
    .unarc()
    .iterate((segment, _index, lastX, lastY) => {
      const commande = segment[0]
      switch (commande) {
        case 'M':
          if (anneau.length > 1) anneaux.push(anneau)
          anneau = [[segment[1], segment[2]]]
          break
        case 'L':
          anneau.push([segment[1], segment[2]])
          break
        case 'H':
          anneau.push([segment[1], lastY])
          break
        case 'V':
          anneau.push([lastX, segment[1]])
          break
        case 'C':
          for (const point of echantillonnerCubique(
            [lastX, lastY],
            [segment[1], segment[2]],
            [segment[3], segment[4]],
            [segment[5], segment[6]],
          )) {
            anneau.push(point)
          }
          break
        case 'Z':
        case 'z':
          if (anneau.length > 1) anneaux.push(anneau)
          anneau = []
          break
        default:
          break
      }
    })
  if (anneau.length > 1) anneaux.push(anneau)
  return anneaux
}

const fermerEtProjeter = (anneau: Ring, maxY: number): Ring => {
  const projete: Ring = anneau.map(([x, y]) => [arrondir(x), arrondir(maxY - y)])
  const premier = projete[0]
  const dernier = projete[projete.length - 1]
  if (premier[0] !== dernier[0] || premier[1] !== dernier[1]) {
    projete.push([premier[0], premier[1]])
  }
  return projete
}

export const convertirSvgEnGeoJson = ({
  svg,
  prefixe,
  maxY,
  nomsParCode,
}: {
  svg: string
  prefixe: string
  maxY: number
  nomsParCode: Record<string, string>
}): GeoJsonFeatureCollection => {
  const features: GeoJsonFeature[] = []
  for (const { code, d } of extrairePaths(svg)) {
    if (!code.startsWith(prefixe)) continue
    const nom = nomsParCode[code]
    if (!nom) throw new Error(`Nom introuvable pour le territoire ${code}`)
    const anneaux = pathVersAnneaux(d).map((anneau) => fermerEtProjeter(anneau, maxY))
    if (anneaux.length === 0) throw new Error(`Aucun anneau pour le territoire ${code}`)
    const geometry: GeoJsonGeometry =
      anneaux.length === 1
        ? { type: 'Polygon', coordinates: [anneaux[0]] }
        : { type: 'MultiPolygon', coordinates: anneaux.map((anneau) => [anneau]) }
    features.push({
      type: 'Feature',
      properties: { code: code.slice(prefixe.length), nom },
      geometry,
    })
  }
  return { type: 'FeatureCollection', features }
}
```

- [ ] **Step 7 : Vérifier que les tests passent**

Demander à l'utilisateur de lancer :
`pnpm test svgVersGeoJson`
Attendu : SUCCÈS (7 tests verts).

- [ ] **Step 8 : Commit**

```bash
git add apps/kpilote-webapp/src/scripts/svgpath.d.ts \
        apps/kpilote-webapp/src/scripts/svgVersGeoJson.ts \
        apps/kpilote-webapp/src/scripts/svgVersGeoJson.test.ts \
        apps/kpilote-webapp/src/api/geoJson.ts \
        apps/kpilote-webapp/package.json \
        pnpm-lock.yaml
git commit -m "feat(kpilote): module de conversion SVG ppg -> GeoJSON stylisé"
```

---

### Task 2 : Script CLI + régénération des cartes

**Files:**
- Create: `apps/kpilote-webapp/src/scripts/genererGeoJsonFrance.ts`
- Modify: `apps/kpilote-webapp/package.json` (script `maps:generate`)
- Modify: `apps/kpilote-webapp/public/maps/france-departements.json` (régénéré)
- Modify: `apps/kpilote-webapp/public/maps/france-regions.json` (régénéré)

**Interfaces:**
- Consumes: `convertirSvgEnGeoJson`, `franceGeoJsonSchema` (Task 1).
- Produces: commande `pnpm run maps:generate` qui régénère les deux fichiers.

- [ ] **Step 1 : Écrire le script CLI**

Créer `apps/kpilote-webapp/src/scripts/genererGeoJsonFrance.ts`. Import **relatif** de `../api/geoJson` (tsx ne résout pas l'alias `@/`) :

```ts
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { franceGeoJsonSchema } from '../api/geoJson'
import { convertirSvgEnGeoJson } from './svgVersGeoJson'

const ici = dirname(fileURLToPath(import.meta.url))
const racineKpilote = resolve(ici, '../..')
const racinePpg = resolve(ici, '../../../pilote-ppg')

type Territoire = { code: string; nomAffiché: string }

const chargerNoms = (): Record<string, string> => {
  const chemin = resolve(racinePpg, 'src/client/constants/territoires.json')
  const contenu = JSON.parse(readFileSync(chemin, 'utf8')) as { territoires: Territoire[] }
  const noms: Record<string, string> = {}
  for (const territoire of contenu.territoires) {
    noms[territoire.code] = territoire.nomAffiché
  }
  return noms
}

const lireMaxY = (svg: string): number => {
  const viewBox = svg.match(/viewBox="([^"]*)"/)?.[1]
  if (!viewBox) throw new Error('viewBox introuvable dans le SVG')
  const [, minY, , hauteur] = viewBox.trim().split(/\s+/).map(Number)
  return minY + hauteur
}

const genererCarte = ({
  fichierSvg,
  prefixe,
  fichierSortie,
  noms,
}: {
  fichierSvg: string
  prefixe: string
  fichierSortie: string
  noms: Record<string, string>
}): void => {
  const svg = readFileSync(resolve(racinePpg, 'public/img', fichierSvg), 'utf8')
  const geoJson = convertirSvgEnGeoJson({ svg, prefixe, maxY: lireMaxY(svg), nomsParCode: noms })
  franceGeoJsonSchema.parse(geoJson)
  const chemin = resolve(racineKpilote, 'public/maps', fichierSortie)
  writeFileSync(chemin, JSON.stringify(geoJson))
  // eslint-disable-next-line no-console
  console.log(`${fichierSortie} : ${geoJson.features.length} territoires`)
}

const noms = chargerNoms()

genererCarte({
  fichierSvg: 'cartographie-vue-departements.svg',
  prefixe: 'DEPT-',
  fichierSortie: 'france-departements.json',
  noms,
})

genererCarte({
  fichierSvg: 'cartographie-vue-regions.svg',
  prefixe: 'REG-',
  fichierSortie: 'france-regions.json',
  noms,
})
```

- [ ] **Step 2 : Ajouter le script npm**

Dans `apps/kpilote-webapp/package.json`, section `scripts`, ajouter :

```json
"maps:generate": "tsx src/scripts/genererGeoJsonFrance.ts",
```

- [ ] **Step 3 : Régénérer les cartes**

Demander à l'utilisateur de lancer (depuis `apps/kpilote-webapp`) :
`pnpm run maps:generate`
Attendu (sortie console) :
```
france-departements.json : 101 territoires
france-regions.json : 18 territoires
```
Si le compte diffère (101 / 18) ou si `franceGeoJsonSchema.parse` jette, s'arrêter et diagnostiquer avant de continuer.

- [ ] **Step 4 : Contrôle rapide des fichiers générés**

Demander à l'utilisateur de lancer :
```bash
node -e "const f=require('./public/maps/france-departements.json'); console.log('dept', f.features.length, f.features.find(x=>x.properties.code==='75')?.properties.nom)"
```
Attendu : `dept 101 Paris`

- [ ] **Step 5 : Commit**

```bash
git add apps/kpilote-webapp/src/scripts/genererGeoJsonFrance.ts \
        apps/kpilote-webapp/package.json \
        apps/kpilote-webapp/public/maps/france-departements.json \
        apps/kpilote-webapp/public/maps/france-regions.json
git commit -m "feat(kpilote): régénère les cartes France en GeoJSON stylisé (petite couronne visible)"
```

---

### Task 3 : Ajuster l'aspectScale ECharts

**Files:**
- Modify: `apps/kpilote-webapp/src/components/widgets/CarteFrance.tsx:69`

**Interfaces:**
- Consumes: les GeoJSON stylisés régénérés (Task 2).

- [ ] **Step 1 : Passer aspectScale à 1**

L'`aspectScale: 0.65` était calibré pour des coordonnées WGS84 (degrés de longitude plus étroits). La carte stylisée encode déjà les bonnes proportions. Dans `CarteFrance.tsx`, remplacer :

```ts
          aspectScale: 0.65,
```

par :

```ts
          aspectScale: 1,
```

- [ ] **Step 2 : Vérifier le rendu dans l'app**

Demander à l'utilisateur de lancer `pnpm dev`, d'ouvrir la vue carte, et de confirmer visuellement :
- la France est à l'endroit et non écrasée verticalement ;
- Paris (75) et la petite couronne (92/93/94) sont agrandies, visibles et survolables ;
- le survol affiche le bon nom (tooltip) et le matching des valeurs par `code` fonctionne (départements et régions).

- [ ] **Step 3 : Lint + tests complets**

Demander à l'utilisateur de lancer :
`pnpm lint` puis `pnpm test`
Attendu : aucun échec.

- [ ] **Step 4 : Commit**

```bash
git add apps/kpilote-webapp/src/components/widgets/CarteFrance.tsx
git commit -m "fix(kpilote): aspectScale 1 pour la carte France stylisée"
```

---

## Notes de vérification (fin de plan)

- **Aucun autre consommateur** des GeoJSON ne dépend de coordonnées géographiques réelles : seul `CarteFrance` (via `CarteFranceWidget`) les utilise, en `type: 'map'` avec matching par `nameProperty: 'code'` (pas de scatter/geo en lat-lon). Confirmer par `grep -rn "france-departements\|france-regions\|registerMap" apps/kpilote-webapp/src`.
- Le style visuel devient volontairement schématique/anguleux sur toute la France (dept + régions) — c'est l'effet recherché.
