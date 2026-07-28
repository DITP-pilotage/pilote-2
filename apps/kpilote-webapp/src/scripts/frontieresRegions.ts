import {
  type GeoJsonFeature,
  type GeoJsonFeatureCollection,
  type GeoJsonGeometry,
} from './svgVersGeoJson'

type Point = [number, number]

// Tolérance de soudure/nettoyage, en unités de la carte (~93 de large). Les
// départements voisins ne partagent pas toujours des sommets exactement
// identiques le long d'une frontière ; on soude les sommets quasi-coïncidents
// pour que la parité d'arêtes annule bien les frontières internes.
const TOLERANCE = 0.1

const cléPoint = (point: Point): string => `${point[0].toFixed(4)},${point[1].toFixed(4)}`
const cléArête = (a: string, b: string): string => (a < b ? `${a}|${b}` : `${b}|${a}`)

const anneauxDeLaGeometrie = (geometry: GeoJsonGeometry): Point[][] =>
  geometry.type === 'Polygon' ? geometry.coordinates : geometry.coordinates.flat()

const tousLesPoints = function* (features: GeoJsonFeature[]): Generator<Point> {
  for (const feature of features) {
    for (const anneau of anneauxDeLaGeometrie(feature.geometry)) {
      for (const point of anneau) yield point
    }
  }
}

/**
 * Soudure des sommets : chaque sommet quasi-coïncident (< TOLERANCE) est ramené à
 * un représentant commun. Renvoie une fonction de projection point → représentant.
 */
const construireSoudure = (features: GeoJsonFeature[]): ((point: Point) => Point) => {
  const representant = new Map<string, Point>()
  const grille = new Map<string, Point[]>()
  const cellule = (p: Point): string =>
    `${Math.floor(p[0] / TOLERANCE)},${Math.floor(p[1] / TOLERANCE)}`

  const chercher = (p: Point): Point | null => {
    const cx = Math.floor(p[0] / TOLERANCE)
    const cy = Math.floor(p[1] / TOLERANCE)
    for (let dx = -1; dx <= 1; dx += 1) {
      for (let dy = -1; dy <= 1; dy += 1) {
        for (const q of grille.get(`${cx + dx},${cy + dy}`) ?? []) {
          if (Math.hypot(q[0] - p[0], q[1] - p[1]) <= TOLERANCE) return q
        }
      }
    }
    return null
  }

  for (const p of tousLesPoints(features)) {
    const cle = cléPoint(p)
    if (representant.has(cle)) continue
    const existant = chercher(p)
    const rep = existant ?? p
    representant.set(cle, rep)
    if (!existant) {
      const c = cellule(rep)
      if (!grille.has(c)) grille.set(c, [])
      grille.get(c)?.push(rep)
    }
  }

  return (point) => representant.get(cléPoint(point)) ?? point
}

type Arête = { a: Point; b: Point; ka: string; kb: string; milieu: Point; longueur: number }

const arête = (a: Point, b: Point): Arête => ({
  a,
  b,
  ka: cléPoint(a),
  kb: cléPoint(b),
  milieu: [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2],
  longueur: Math.hypot(a[0] - b[0], a[1] - b[1]),
})

// Deux arêtes quasi-superposées (mêmes milieu, direction et longueur) trahissent
// une frontière interne dessinée deux fois avec des sommets légèrement différents
// que la soudure n'a pas suffi à fusionner.
const quasiSuperposées = (e: Arête, o: Arête): boolean => {
  if (Math.hypot(e.milieu[0] - o.milieu[0], e.milieu[1] - o.milieu[1]) > TOLERANCE) return false
  if (e.longueur === 0 || o.longueur === 0) return false
  const ratio = e.longueur / o.longueur
  if (ratio < 0.5 || ratio > 2) return false
  const cos =
    ((e.b[0] - e.a[0]) * (o.b[0] - o.a[0]) + (e.b[1] - e.a[1]) * (o.b[1] - o.a[1])) /
    (e.longueur * o.longueur)
  return Math.abs(cos) > 0.9
}

/**
 * Contour de région dissous à partir des départements. Une arête interne à une
 * région (partagée par deux départements) apparaît un nombre pair de fois après
 * soudure et s'annule. Les arêtes restantes forment la frontière ; on retire
 * encore les résidus quasi-superposés (near-miss non soudés) puis on recolle.
 */
const contourRegion = (departements: GeoJsonFeature[], souder: (p: Point) => Point): Point[][] => {
  const compte = new Map<string, number>()
  const parCle = new Map<string, Arête>()

  for (const feature of departements) {
    for (const anneau of anneauxDeLaGeometrie(feature.geometry)) {
      for (let i = 0; i < anneau.length - 1; i += 1) {
        const brut = anneau[i]
        const brutSuivant = anneau[i + 1]
        if (!brut || !brutSuivant) continue
        const a = souder(brut)
        const b = souder(brutSuivant)
        const cle = cléArête(cléPoint(a), cléPoint(b))
        if (cléPoint(a) === cléPoint(b)) continue
        compte.set(cle, (compte.get(cle) ?? 0) + 1)
        if (!parCle.has(cle)) parCle.set(cle, arête(a, b))
      }
    }
  }

  const frontière = [...compte]
    .filter(([, n]) => n % 2 === 1)
    .map(([cle]) => parCle.get(cle))
    .filter((e): e is Arête => e !== undefined)

  // Retire les arêtes intérieures résiduelles (une arête qui a une quasi-jumelle
  // dans la même région n'est pas une vraie frontière).
  const gardées = frontière.filter((e) => !frontière.some((o) => o !== e && quasiSuperposées(e, o)))

  return recoller(gardées)
}

// Recollement des arêtes en anneaux fermés.
const recoller = (arêtes: Arête[]): Point[][] => {
  const parCle = new Map<string, Arête>()
  const adjacence = new Map<string, Set<string>>()
  const pointParCle = new Map<string, Point>()
  for (const e of arêtes) {
    const cle = cléArête(e.ka, e.kb)
    parCle.set(cle, e)
    pointParCle.set(e.ka, e.a)
    pointParCle.set(e.kb, e.b)
    if (!adjacence.has(e.ka)) adjacence.set(e.ka, new Set())
    if (!adjacence.has(e.kb)) adjacence.set(e.kb, new Set())
    adjacence.get(e.ka)?.add(cle)
    adjacence.get(e.kb)?.add(cle)
  }

  const anneaux: Point[][] = []
  const utilisées = new Set<string>()
  for (const [départ, arêteDépart] of parCle) {
    if (utilisées.has(départ)) continue
    const anneau: Point[] = [arêteDépart.a]
    let sommet = arêteDépart.ka
    let courante: string | null = départ
    while (courante && !utilisées.has(courante)) {
      utilisées.add(courante)
      const e = parCle.get(courante)
      if (!e) break
      const suivantCle = e.ka === sommet ? e.kb : e.ka
      const suivantPoint = pointParCle.get(suivantCle)
      if (!suivantPoint) break
      anneau.push(suivantPoint)
      sommet = suivantCle
      courante = [...(adjacence.get(sommet) ?? [])].find((c) => !utilisées.has(c)) ?? null
    }
    const premier = anneau[0]
    const dernier = anneau[anneau.length - 1]
    if (premier && dernier && (premier[0] !== dernier[0] || premier[1] !== dernier[1])) {
      anneau.push(premier)
    }
    if (anneau.length >= 4) anneaux.push(anneau)
  }
  return anneaux
}

export const construireFrontieresRegions = ({
  departements,
  regionDe,
  nomRegion,
}: {
  departements: GeoJsonFeatureCollection
  regionDe: (codeDept: string) => string
  nomRegion: (codeRegion: string) => string
}): GeoJsonFeatureCollection => {
  const souder = construireSoudure(departements.features)

  const parRegion = new Map<string, GeoJsonFeature[]>()
  for (const feature of departements.features) {
    const region = regionDe(feature.properties.code)
    if (!parRegion.has(region)) parRegion.set(region, [])
    parRegion.get(region)?.push(feature)
  }

  const features: GeoJsonFeature[] = []
  for (const [region, depts] of parRegion) {
    const anneaux = contourRegion(depts, souder)
    if (anneaux.length === 0) continue
    features.push({
      type: 'Feature',
      properties: { code: region, nom: nomRegion(region) },
      geometry: { type: 'MultiPolygon', coordinates: anneaux.map((anneau) => [anneau]) },
    })
  }
  return { type: 'FeatureCollection', features }
}
