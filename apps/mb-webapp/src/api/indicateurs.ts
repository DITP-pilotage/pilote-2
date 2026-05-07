import {
  type IndicateurApiModel,
  indicateurApiModelSchema,
  type IndicateurListApiModel,
  indicateurListApiModelSchema,
} from '@pilote/mb-shared/indicateur'
import { type PaginateQuery } from '@pilote/mb-shared/pagination'
import {
  type IndividusWithValeursListApiModel,
  individusWithValeursListApiModelSchema,
  type ValeurAvancementListApiModel,
  valeurAvancementListApiModelSchema,
} from '@pilote/mb-shared/valeurAvancement'

import { apiClient } from '@/api/client'

export type IndicateursQueryParams = PaginateQuery & {
  recherche?: string | undefined
}

export const fetchIndicateurs = async (
  params: IndicateursQueryParams,
): Promise<IndicateurListApiModel> => {
  // ky filters out `undefined` values from object-form searchParams (see
  // Ky.#normalizeSearchParams), so we can pass `params` directly.
  const json = await apiClient.get('indicateurs', { searchParams: params }).json()
  return indicateurListApiModelSchema.parse(json)
}

export const fetchIndicateurById = async (id: string): Promise<IndicateurApiModel> => {
  const json = await apiClient.get(`indicateurs/${id}`).json()
  return indicateurApiModelSchema.parse(json)
}

export const fetchIndividusForIndicateur = async (
  indicateurId: string,
  params: { cursor?: string } = {},
): Promise<IndividusWithValeursListApiModel> => {
  const json = await apiClient
    .get(`indicateurs/${indicateurId}/individus`, { searchParams: params })
    .json()
  return individusWithValeursListApiModelSchema.parse(json)
}

export const fetchValeursForIndicateur = async (
  indicateurId: string,
  params: { individus: string[] },
): Promise<ValeurAvancementListApiModel> => {
  const json = await apiClient
    .get(`indicateurs/${indicateurId}/valeurs`, {
      searchParams: { individus: params.individus.join(',') },
    })
    .json()
  return valeurAvancementListApiModelSchema.parse(json)
}
