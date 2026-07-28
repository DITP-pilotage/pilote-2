import { describe, expect, it } from 'vitest'

import { franceGeoJsonSchema } from '@/api/geoJson'
import { construireFrontieresRegions } from '@/scripts/frontieresRegions'
import { type GeoJsonFeature, type GeoJsonFeatureCollection } from '@/scripts/svgVersGeoJson'

const carre = (code: string, x0: number, y0: number, x1: number, y1: number): GeoJsonFeature => ({
  type: 'Feature',
  properties: { code, nom: code },
  geometry: {
    type: 'Polygon',
    coordinates: [
      [
        [x0, y0],
        [x1, y0],
        [x1, y1],
        [x0, y1],
        [x0, y0],
      ],
    ],
  },
})

// A + B (même région G1) partagent l'arête x=1 ; C (région G2) partage x=2 avec B.
const departements: GeoJsonFeatureCollection = {
  type: 'FeatureCollection',
  features: [carre('01', 0, 0, 1, 1), carre('02', 1, 0, 2, 1), carre('03', 2, 0, 3, 1)],
}

const regionDe = (code: string): string => (code === '03' ? 'G2' : 'G1')
const nomRegion = (code: string): string => `Région ${code}`

const anneauxDe = (
  collection: GeoJsonFeatureCollection,
  code: string,
): Array<Array<[number, number]>> => {
  const feature = collection.features.find((f) => f.properties.code === code)
  if (!feature) throw new Error(`Feature ${code} introuvable`)
  const g = feature.geometry
  return g.type === 'Polygon' ? g.coordinates : g.coordinates.flat()
}

const arêtes = (anneau: Array<[number, number]>): Set<string> => {
  const set = new Set<string>()
  for (let i = 0; i < anneau.length - 1; i += 1) {
    const a = `${anneau[i]?.[0]},${anneau[i]?.[1]}`
    const b = `${anneau[i + 1]?.[0]},${anneau[i + 1]?.[1]}`
    set.add(a < b ? `${a}|${b}` : `${b}|${a}`)
  }
  return set
}

describe('construireFrontieresRegions', () => {
  it('produit un contour par région', () => {
    const result = construireFrontieresRegions({ departements, regionDe, nomRegion })
    expect(result.features.map((f) => f.properties.code).sort()).toEqual(['G1', 'G2'])
    expect(result.features.find((f) => f.properties.code === 'G1')?.properties.nom).toBe(
      'Région G1',
    )
  })

  it('dissout les arêtes internes à une région (union des départements)', () => {
    const result = construireFrontieresRegions({ departements, regionDe, nomRegion })
    const anneaux = anneauxDe(result, 'G1')
    expect(anneaux).toHaveLength(1)
    const set = arêtes(anneaux[0] ?? [])
    // L'arête interne partagée x=1 (entre 01 et 02) doit avoir disparu.
    expect(set.has('1,0|1,1')).toBe(false)
    // Le contour extérieur du rectangle 0..2 est présent.
    expect(set.has('0,0|1,0')).toBe(true)
    expect(set.has('2,0|2,1')).toBe(true)
  })

  it('recolle un anneau fermé', () => {
    const result = construireFrontieresRegions({ departements, regionDe, nomRegion })
    const [anneau] = anneauxDe(result, 'G1')
    expect(anneau?.[0]).toEqual(anneau?.[anneau.length - 1])
  })

  it('produit un GeoJSON conforme au schéma de l’app', () => {
    const result = construireFrontieresRegions({ departements, regionDe, nomRegion })
    expect(() => franceGeoJsonSchema.parse(result)).not.toThrow()
  })
})
