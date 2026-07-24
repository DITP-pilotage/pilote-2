import ky from 'ky'
import { z } from 'zod'

const geoJsonFeatureSchema = z.object({
  type: z.literal('Feature'),
  geometry: z.unknown(),
  properties: z.object({ code: z.string(), nom: z.string() }),
})

export const franceGeoJsonSchema = z.object({
  type: z.literal('FeatureCollection'),
  features: z.array(geoJsonFeatureSchema).readonly(),
})
export type FranceGeoJson = z.infer<typeof franceGeoJsonSchema>

const fetchGeoJson = async (url: string): Promise<FranceGeoJson> => {
  const json = await ky.get(url).json()
  return franceGeoJsonSchema.parse(json)
}

export const fetchFranceDepartementsGeoJson = (): Promise<FranceGeoJson> =>
  fetchGeoJson('/maps/france-departements.json')

export const fetchFranceRegionsGeoJson = (): Promise<FranceGeoJson> =>
  fetchGeoJson('/maps/france-regions.json')
