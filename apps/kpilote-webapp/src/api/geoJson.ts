import { z } from 'zod'

const geoJsonFeatureSchema = z.object({
  type: z.literal('Feature'),
  geometry: z.unknown(),
  properties: z.object({ code: z.string(), nom: z.string() }),
})

// Contrat des cartes France. Validé à la génération (`pnpm maps:generate`) ;
// les cartes sont ensuite importées statiquement (cf. `@/assets/maps`).
export const franceGeoJsonSchema = z.object({
  type: z.literal('FeatureCollection'),
  features: z.array(geoJsonFeatureSchema).readonly(),
})
export type FranceGeoJson = z.infer<typeof franceGeoJsonSchema>
