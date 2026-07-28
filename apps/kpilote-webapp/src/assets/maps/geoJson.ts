import { z } from 'zod'

const geoJsonFeatureSchema = z.object({
  type: z.literal('Feature'),
  geometry: z.unknown(),
  properties: z.object({ code: z.string(), nom: z.string() }),
})

// Contrat des cartes France. Validé à la génération (`pnpm maps:generate`) et à
// l'import (cf. `index.ts`). `geometry: unknown` : on ne parcourt pas les
// coordonnées, la validation reste bon marché.
export const franceGeoJsonSchema = z.object({
  type: z.literal('FeatureCollection'),
  features: z.array(geoJsonFeatureSchema).readonly(),
})
export type FranceGeoJson = z.infer<typeof franceGeoJsonSchema>
