import {
  type IndicateurApiModel,
  indicateurApiModelSchema,
  type IndicateurListApiModel,
  indicateurListApiModelSchema,
  type IndicateurPublicId,
} from '@pilote/mb-shared/api'

import { apiClient } from '@/api/client'

export type IndicateursQueryParams = {
  recherche?: string | undefined
  cursor?: string | undefined
}

export const fetchIndicateurs = async (
  params: IndicateursQueryParams,
): Promise<IndicateurListApiModel> => {
  // ky filters out `undefined` values from object-form searchParams (see
  // Ky.#normalizeSearchParams), so we can pass `params` directly.
  const json = await apiClient.get('indicateurs', { searchParams: params }).json()
  return indicateurListApiModelSchema.parse(json)
}

export const fetchIndicateurById = async (
  id: IndicateurPublicId,
): Promise<IndicateurApiModel> => {
  const json = await apiClient.get(`indicateurs/${id}`).json()
  return indicateurApiModelSchema.parse(json)
}
