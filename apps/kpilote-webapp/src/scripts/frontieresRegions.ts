import {
  type GeoJsonFeature,
  type GeoJsonFeatureCollection,
  type GeoJsonGeometry,
} from './svgVersGeoJson'

type Point = [number, number]

// Clé canonique d'un point (tolère les imprécisions de virgule flottante).
const cléPoint = (point: Point): string => `${point[0].toFixed(4)},${point[1].toFixed(4)}`
const cléArête = (a: string, b: string): string => (a < b ? `${a}|${b}` : `${b}|${a}`)

const anneauxDeLaGeometrie = (geometry: GeoJsonGeometry): Point[][] =>
  geometry.type === 'Polygon' ? geometry.coordinates : geometry.coordinates.flat()

type Sommet = { cle: string; point: Point }

/**
 * Contour de région dissous à partir des départements : une arête interne à une
 * région (partagée par deux départements) apparaît un nombre pair de fois et
 * s'annule ; les arêtes restantes (nombre impair) forment la frontière de la
 * région. Ces arêtes sont ensuite recollées en anneaux fermés.
 */
const contourRegion = (departements: GeoJsonFeature[]): Point[][] => {
  const compte = new Map<string, number>()
  const voisins = new Map<string, Sommet[]>()

  const ajouterArête = (a: Point, b: Point): void => {
    const ka = cléPoint(a)
    const kb = cléPoint(b)
    if (ka === kb) return
    const cle = cléArête(ka, kb)
    compte.set(cle, (compte.get(cle) ?? 0) + 1)
    if (!voisins.has(ka)) voisins.set(ka, [])
    if (!voisins.has(kb)) voisins.set(kb, [])
    voisins.get(ka)?.push({ cle: kb, point: b })
    voisins.get(kb)?.push({ cle: ka, point: a })
  }

  for (const feature of departements) {
    for (const anneau of anneauxDeLaGeometrie(feature.geometry)) {
      for (let i = 0; i < anneau.length - 1; i += 1) {
        const a = anneau[i]
        const b = anneau[i + 1]
        if (a && b) ajouterArête(a, b)
      }
    }
  }

  // Arêtes de frontière = présentes un nombre impair de fois.
  const arêtesRestantes = new Map<string, { a: Sommet; b: Sommet }>()
  const adjacence = new Map<string, Set<string>>()
  const pointParCle = new Map<string, Point>()
  for (const feature of departements) {
    for (const anneau of anneauxDeLaGeometrie(feature.geometry)) {
      for (const point of anneau) pointParCle.set(cléPoint(point), point)
    }
  }
  for (const [cle, n] of compte) {
    if (n % 2 === 0) continue
    const [ka, kb] = cle.split('|') as [string, string]
    const pa = pointParCle.get(ka)
    const pb = pointParCle.get(kb)
    if (!pa || !pb) continue
    arêtesRestantes.set(cle, { a: { cle: ka, point: pa }, b: { cle: kb, point: pb } })
    if (!adjacence.has(ka)) adjacence.set(ka, new Set())
    if (!adjacence.has(kb)) adjacence.set(kb, new Set())
    adjacence.get(ka)?.add(cle)
    adjacence.get(kb)?.add(cle)
  }

  // Recollement des arêtes en anneaux fermés.
  const anneaux: Point[][] = []
  const utilisées = new Set<string>()
  for (const [départ, aretesDépart] of arêtesRestantes) {
    if (utilisées.has(départ)) continue
    const anneau: Point[] = [aretesDépart.a.point]
    let sommetCourant = aretesDépart.a.cle
    let areteCourante: string | null = départ
    while (areteCourante && !utilisées.has(areteCourante)) {
      utilisées.add(areteCourante)
      const arete = arêtesRestantes.get(areteCourante)
      if (!arete) break
      const suivant = arete.a.cle === sommetCourant ? arete.b : arete.a
      anneau.push(suivant.point)
      sommetCourant = suivant.cle
      areteCourante =
        [...(adjacence.get(sommetCourant) ?? [])].find((c) => !utilisées.has(c)) ?? null
    }
    // Ferme l'anneau.
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
  const parRegion = new Map<string, GeoJsonFeature[]>()
  for (const feature of departements.features) {
    const region = regionDe(feature.properties.code)
    if (!parRegion.has(region)) parRegion.set(region, [])
    parRegion.get(region)?.push(feature)
  }

  const features: GeoJsonFeature[] = []
  for (const [region, depts] of parRegion) {
    const anneaux = contourRegion(depts)
    if (anneaux.length === 0) continue
    features.push({
      type: 'Feature',
      properties: { code: region, nom: nomRegion(region) },
      geometry: { type: 'MultiPolygon', coordinates: anneaux.map((anneau) => [anneau]) },
    })
  }
  return { type: 'FeatureCollection', features }
}
