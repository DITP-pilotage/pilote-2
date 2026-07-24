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
