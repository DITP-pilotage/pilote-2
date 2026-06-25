import { z } from 'zod'

import { apiClient } from '@/api/client'

const itemNormaliseSchema = z.object({
  individu: z.string(),
  date: z.string(),
  valeur: z.number(),
})

const warningSchema = z.object({
  code: z.enum(['INDIVIDU_NON_RECONNU', 'CONFIANCE_BASSE', 'DATE_INVALIDE', 'VALEUR_INVALIDE']),
  message: z.string(),
  ligneSource: z.number().int().optional(),
  libelleSource: z.string().optional(),
  publicIdRetenu: z.string().optional(),
  score: z.number().optional(),
})

const rapportSchema = z.object({
  totalLignes: z.number().int(),
  totalItemsExtraits: z.number().int(),
  totalItemsRetenus: z.number().int(),
  totalItemsBasseConfiance: z.number().int(),
  totalItemsIgnores: z.number().int(),
})

export const normaliserResponseSchema = z.object({
  items: z.array(itemNormaliseSchema),
  warnings: z.array(warningSchema),
  rapport: rapportSchema,
})

export type NormaliserResponse = z.infer<typeof normaliserResponseSchema>
export type ItemNormalise = z.infer<typeof itemNormaliseSchema>
export type NormaliserWarning = z.infer<typeof warningSchema>

export const normaliserFichierPoc = async ({
  indicateurId,
  rows,
  nomFichier,
}: {
  indicateurId: string
  rows: Array<Record<string, unknown>>
  nomFichier?: string
}): Promise<NormaliserResponse> => {
  const json = await apiClient
    .post(`import-poc/indicateurs/${indicateurId}/normaliser`, {
      json: { rows, ...(nomFichier ? { nomFichier } : {}) },
      timeout: 120_000,
    })
    .json()
  return normaliserResponseSchema.parse(json)
}
