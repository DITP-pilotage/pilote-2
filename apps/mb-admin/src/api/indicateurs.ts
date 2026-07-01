import type {
  IndicateurApiModel,
  IndicateurListApiModel,
  UpsertIndicateurBody,
} from '@pilote/mb-shared/indicateur'
import {
  indicateurApiModelSchema,
  indicateurListApiModelSchema,
} from '@pilote/mb-shared/indicateur'

import { bffClient } from '@/api/client'

export type ListIndicateursParams = { recherche?: string | undefined; cursor?: string | undefined }

export const fetchIndicateurs = async (
  params: ListIndicateursParams,
): Promise<IndicateurListApiModel> => {
  const searchParams: Record<string, string> = {}
  if (params.recherche) searchParams.recherche = params.recherche
  if (params.cursor) searchParams.cursor = params.cursor
  const json = await bffClient.get('indicateurs', { searchParams }).json()
  return indicateurListApiModelSchema.parse(json)
}

export const fetchIndicateurById = async (id: string): Promise<IndicateurApiModel> => {
  const json = await bffClient.get(`indicateurs/${id}`).json()
  return indicateurApiModelSchema.parse(json)
}

export const createIndicateur = async (body: UpsertIndicateurBody): Promise<IndicateurApiModel> => {
  const json = await bffClient.post('indicateurs', { json: body }).json()
  return indicateurApiModelSchema.parse(json)
}

export const updateIndicateur = async (
  id: string,
  body: UpsertIndicateurBody,
): Promise<IndicateurApiModel> => {
  const json = await bffClient.put(`indicateurs/${id}`, { json: body }).json()
  return indicateurApiModelSchema.parse(json)
}
