import { z } from 'zod'

const positionSchema = z.array(z.number())

// Géométrie typée concrètement (Polygon/MultiPolygon avec coordinates
// number[][][]) : structurellement compatible avec le type GeoJSON d'ECharts,
// ce qui permet `registerMap` sans cast.
const geometrySchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('Polygon'), coordinates: z.array(z.array(positionSchema)) }),
  z.object({
    type: z.literal('MultiPolygon'),
    coordinates: z.array(z.array(z.array(positionSchema))),
  }),
])

const geoJsonFeatureSchema = z.object({
  type: z.literal('Feature'),
  geometry: geometrySchema,
  properties: z.object({ code: z.string(), nom: z.string() }),
})

// Contrat des cartes France. Validé à la génération (`pnpm maps:generate`) et à
// l'import (cf. `index.ts`). `features` mutable (pas de `.readonly()`) pour rester
// assignable au type attendu par `echarts.registerMap`.
export const franceGeoJsonSchema = z.object({
  type: z.literal('FeatureCollection'),
  features: z.array(geoJsonFeatureSchema),
})
export type FranceGeoJson = z.infer<typeof franceGeoJsonSchema>
