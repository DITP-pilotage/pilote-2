import { z } from 'zod'

import { dateSchema } from './dates'
import { individuPublicIdSchema } from './publicIds'

const colonneDateSchema = z.object({
  nom: z.string(),
  format: z.enum(['iso', 'fr-libre', 'quarter', 'annee']),
})

const planLongSchema = z.object({
  layout: z.literal('long'),
  colonneIndividu: z.string(),
  colonneDate: colonneDateSchema,
  colonneValeur: z.string(),
})

const planPivotSchema = z.object({
  layout: z.literal('pivot'),
  colonneIndividu: z.string(),
  colonnesPivot: z.array(z.object({ nom: z.string(), dateIso: z.string() })).min(1),
})

export const normaliserPlanSchema = z.discriminatedUnion('layout', [
  planLongSchema,
  planPivotSchema,
])
export type NormaliserPlan = z.infer<typeof normaliserPlanSchema>

export const itemNormaliseApiModelSchema = z.object({
  individu: individuPublicIdSchema,
  date: dateSchema,
  valeur: z.number(),
})
export type ItemNormaliseApiModel = z.infer<typeof itemNormaliseApiModelSchema>

export const normaliserWarningSchema = z.object({
  code: z.enum([
    'INDIVIDU_NON_RESOLU',
    'INDIVIDU_HALLUCINE',
    'DATE_INVALIDE',
    'VALEUR_INVALIDE',
    'CELLULE_VIDE',
  ]),
  message: z.string(),
  ligneSource: z.number().int().optional(),
  libelleSource: z.string().optional(),
  colonneSource: z.string().optional(),
})
export type NormaliserWarning = z.infer<typeof normaliserWarningSchema>

const resolutionApiSchema = z.object({
  mapping: z.array(z.object({ libelleSource: z.string(), individuPublicId: z.string() })),
  nonResolus: z.array(z.object({ libelleSource: z.string(), raison: z.string() })),
})

const rapportSchema = z.object({
  totalLignes: z.number().int().nonnegative(),
  totalItemsProduits: z.number().int().nonnegative(),
  totalLibellesSources: z.number().int().nonnegative(),
  totalLibellesMappes: z.number().int().nonnegative(),
  totalLibellesNonResolus: z.number().int().nonnegative(),
})

export const normaliserValeursImportResponseApiModelSchema = z.object({
  plan: normaliserPlanSchema,
  resolution: resolutionApiSchema,
  items: z.array(itemNormaliseApiModelSchema),
  warnings: z.array(normaliserWarningSchema),
  rapport: rapportSchema,
})
export type NormaliserValeursImportResponseApiModel = z.infer<
  typeof normaliserValeursImportResponseApiModelSchema
>
