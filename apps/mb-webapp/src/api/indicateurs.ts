import {
  type IndicateurApiModel,
  indicateurApiModelSchema,
  type IndicateurListApiModel,
  indicateurListApiModelSchema,
  type IndicateurStatut,
} from '@pilote/mb-shared'

import { apiClient } from '@/api/client'

export type IndicateursQueryParams = {
  recherche?: string | undefined
  statut?: IndicateurStatut | undefined
  cursor?: string | undefined
}

export const fetchIndicateurs = async (
  params: IndicateursQueryParams,
): Promise<IndicateurListApiModel> => {
  const searchParams = new URLSearchParams()
  if (params.recherche) searchParams.set('recherche', params.recherche)
  if (params.statut) searchParams.set('statut', params.statut)
  if (params.cursor) searchParams.set('cursor', params.cursor)

  const json = await apiClient.get('indicateurs', { searchParams }).json()
  return indicateurListApiModelSchema.parse(json)
}

export const fetchIndicateurById = async (id: number): Promise<IndicateurApiModel> => {
  const json = await apiClient.get(`indicateurs/${id}`).json()
  return indicateurApiModelSchema.parse(json)
}
