import { z } from 'zod'

import { createPaginatedApiListSchema, listQuerySchema } from './pagination'
import { individuPublicIdSchema, referentielPublicIdSchema } from './publicIds'
import { widgetApiModelSchema } from './widget'

export { referentielPublicIdSchema } from './publicIds'

export const referentielApiModelSchema = z.object({
  id: referentielPublicIdSchema,
  nom: z.string().describe('Nom lisible du référentiel.'),
  description: z.string().nullable().describe('Description optionnelle du référentiel.'),
  nombreIndividus: z
    .number()
    .int()
    .nonnegative()
    .describe("Nombre d'individus appartenant à la population du référentiel."),
  widgets: z
    .array(widgetApiModelSchema)
    .describe(
      'Widgets de visualisation compatibles avec ce référentiel (ex. carte de France pour REF-DEPT).',
    ),
  createdAt: z.string().datetime().describe('Date ISO 8601 de création.'),
  updatedAt: z.string().datetime().describe('Date ISO 8601 de dernière mise à jour.'),
})
export type ReferentielApiModel = z.infer<typeof referentielApiModelSchema>

export const referentielListApiModelSchema = createPaginatedApiListSchema(referentielApiModelSchema)
export type ReferentielListApiModel = z.infer<typeof referentielListApiModelSchema>

export const referentielScopeSchema = z
  .string()
  .regex(/^(me|panier:.+)$/)
  .describe(
    "Restreint aux référentiels reliés à ≥1 indicateur pertinent : `me` (indicateurs lisibles par l'utilisateur) ou `panier:<publicId>` (indicateurs du panier).",
  )
export type ReferentielScope = z.infer<typeof referentielScopeSchema>

export const listReferentielsQuerySchema = listQuerySchema.extend({
  scope: referentielScopeSchema.optional(),
})
export type ListReferentielsQuery = z.infer<typeof listReferentielsQuerySchema>

export const upsertReferentielIndividuItemSchema = z.object({
  publicId: individuPublicIdSchema,
  nom: z.string().min(1).describe("Nom lisible de l'individu."),
})
export type UpsertReferentielIndividuItem = z.infer<typeof upsertReferentielIndividuItemSchema>

export const upsertReferentielBodySchema = z.object({
  nom: z.string().min(1).describe('Nom lisible du référentiel.'),
  description: z.string().nullable().describe('Description du référentiel (peut être null).'),
  individus: z
    .array(upsertReferentielIndividuItemSchema)
    .optional()
    .describe(
      "Individus à upsert et rattacher à ce référentiel. Un individu ne peut appartenir qu'à un seul référentiel : si un individu listé existe déjà et est rattaché à un autre référentiel, la requête est rejetée (409).",
    ),
})
export type UpsertReferentielBody = z.infer<typeof upsertReferentielBodySchema>
