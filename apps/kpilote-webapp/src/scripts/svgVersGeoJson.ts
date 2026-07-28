import svgpath from 'svgpath'

type Point = [number, number]
type Ring = Point[]

export type GeoJsonGeometry =
  { type: 'Polygon'; coordinates: Ring[] } | { type: 'MultiPolygon'; coordinates: Ring[][] }

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
  if (!premier || !dernier) return projete
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
    const [premierAnneau] = anneaux
    if (!premierAnneau) throw new Error(`Aucun anneau pour le territoire ${code}`)
    const geometry: GeoJsonGeometry =
      anneaux.length === 1
        ? { type: 'Polygon', coordinates: [premierAnneau] }
        : { type: 'MultiPolygon', coordinates: anneaux.map((anneau) => [anneau]) }
    features.push({
      type: 'Feature',
      properties: { code: code.slice(prefixe.length), nom },
      geometry,
    })
  }
  return { type: 'FeatureCollection', features }
}
