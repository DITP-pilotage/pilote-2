import { HTTPError } from 'ky'
import { z } from 'zod'

import { apiClient } from '@/api/client'

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
  colonnesPivot: z.array(z.object({ nom: z.string(), dateIso: z.string() })),
})

export const planSchema = z.discriminatedUnion('layout', [planLongSchema, planPivotSchema])
export type Plan = z.infer<typeof planSchema>

const itemNormaliseSchema = z.object({
  individu: z.string(),
  date: z.string(),
  valeur: z.number(),
})

const warningSchema = z.object({
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

const resolutionSchema = z.object({
  mapping: z.array(z.object({ libelleSource: z.string(), individuPublicId: z.string() })),
  nonResolus: z.array(z.object({ libelleSource: z.string(), raison: z.string() })),
})

const rapportSchema = z.object({
  totalLignes: z.number().int(),
  totalItemsProduits: z.number().int(),
  totalLibellesSources: z.number().int(),
  totalLibellesMappes: z.number().int(),
  totalLibellesNonResolus: z.number().int(),
})

export const normaliserResponseSchema = z.object({
  plan: planSchema,
  resolution: resolutionSchema,
  items: z.array(itemNormaliseSchema),
  warnings: z.array(warningSchema),
  rapport: rapportSchema,
})

export type NormaliserResponse = z.infer<typeof normaliserResponseSchema>
export type ItemNormalise = z.infer<typeof itemNormaliseSchema>
export type NormaliserWarning = z.infer<typeof warningSchema>
export type Resolution = z.infer<typeof resolutionSchema>

const errorPayloadSchema = z.object({
  code: z.string(),
  message: z.string(),
  details: z.unknown().optional(),
})

export type NormaliserApiError = {
  code: string
  message: string
  details?: unknown
}

export class NormaliserError extends Error {
  readonly payload: NormaliserApiError
  constructor(payload: NormaliserApiError) {
    super(payload.message)
    this.name = 'NormaliserError'
    this.payload = payload
  }
}

export const normaliserFichierPoc = async ({
  indicateurId,
  rows,
  nomFichier,
}: {
  indicateurId: string
  rows: Array<Record<string, unknown>>
  nomFichier?: string
}): Promise<NormaliserResponse> => {
  try {
    const json = await apiClient
      .post(`import-poc/indicateurs/${indicateurId}/normaliser`, {
        json: { rows, ...(nomFichier ? { nomFichier } : {}) },
        timeout: 180_000,
      })
      .json()
    return normaliserResponseSchema.parse(json)
  } catch (cause) {
    if (cause instanceof HTTPError) {
      const raw: unknown = await cause.response.json().catch(() => null)
      const parsed = errorPayloadSchema.safeParse(raw)
      if (parsed.success) throw new NormaliserError(parsed.data)
    }
    throw cause
  }
}
