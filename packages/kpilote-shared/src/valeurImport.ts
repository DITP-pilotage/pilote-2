import { z } from 'zod'

import { dateSchema } from './dates'
import { axePublicIdSchema, individuPublicIdSchema, modalitePublicIdSchema } from './publicIds'

const colonneDateSchema = z.object({
  nom: z.string(),
})

const colonneTypeValeurSchema = z.object({ nom: z.string() })

// Indicateur à axes seulement : la colonne qui porte les modalités de chaque axe.
const colonnesAxesSchema = z.array(z.object({ colonne: z.string(), axe: axePublicIdSchema }))

const planLongSchema = z.object({
  layout: z.literal('long'),
  colonneIndividu: z.string(),
  colonneDate: colonneDateSchema,
  colonneValeur: z.string(),
  colonneTypeValeur: colonneTypeValeurSchema.optional(),
  colonnesAxes: colonnesAxesSchema.optional(),
})

const planPivotSchema = z.object({
  layout: z.literal('pivot'),
  colonneIndividu: z.string(),
  colonnesPivot: z.array(z.object({ nom: z.string(), dateIso: z.string() })).min(1),
  colonneTypeValeur: colonneTypeValeurSchema.optional(),
  colonnesAxes: colonnesAxesSchema.optional(),
})

export const normaliserPlanSchema = z.discriminatedUnion('layout', [
  planLongSchema,
  planPivotSchema,
])
export type NormaliserPlan = z.infer<typeof normaliserPlanSchema>

export const itemNormaliseApiModelSchema = z.object({
  individu: individuPublicIdSchema,
  // Une modalité par axe de l'indicateur, dans l'ordre des axes ; absent sans axe.
  modalites: z.array(modalitePublicIdSchema).optional(),
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
    'LIGNE_IGNOREE',
    'MODALITE_NON_RESOLUE',
    'LIGNE_PARTIELLE',
    'AXE_NON_COUVERT',
    'COLONNE_AXE_IGNOREE',
  ]),
  message: z.string(),
  ligneSource: z.number().int().optional(),
  libelleSource: z.string().optional(),
  colonneSource: z.string().optional(),
})
export type NormaliserWarning = z.infer<typeof normaliserWarningSchema>

const nonResolusSchema = z.array(z.object({ libelleSource: z.string(), raison: z.string() }))

const resolutionApiSchema = z.object({
  mapping: z.array(z.object({ libelleSource: z.string(), individuPublicId: z.string() })),
  nonResolus: nonResolusSchema,
  // Indicateur à axes seulement : la résolution de chaque colonne d'axe retenue.
  colonnesAxes: z
    .array(
      z.object({
        colonne: z.string(),
        axe: axePublicIdSchema,
        mapping: z.array(z.object({ libelleSource: z.string(), modalitePublicId: z.string() })),
        nonResolus: nonResolusSchema,
      }),
    )
    .optional(),
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
  resolutionTypeValeur: z
    .object({
      colonne: z.string(),
      typesValeurDistincts: z.array(z.string()),
      typesValeurRetenus: z.array(z.string()),
    })
    .optional(),
})
export type NormaliserValeursImportResponseApiModel = z.infer<
  typeof normaliserValeursImportResponseApiModelSchema
>

// Erreurs métier 422 de la normalisation. Source de vérité partagée back/front :
// la route type ses réponses contre ce schéma, le client parse le body avec.
export const normaliserErrorApiModelSchema = z.discriminatedUnion('code', [
  z.object({
    code: z.literal('PLAN_ECHEC'),
    message: z.string(),
    details: z.object({ raison: z.string(), explication: z.string() }),
  }),
  z.object({
    code: z.literal('RESOLUTION_ECHEC'),
    message: z.string(),
  }),
])
export type NormaliserErrorApiModel = z.infer<typeof normaliserErrorApiModelSchema>
