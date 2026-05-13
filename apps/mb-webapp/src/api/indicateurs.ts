import {
  type IndicateurApiModel,
  indicateurApiModelSchema,
  type IndicateurListApiModel,
  indicateurListApiModelSchema,
  type ListIndicateursQuery,
} from '@pilote/mb-shared/indicateur'
import {
  type IndividusWithValeursListApiModel,
  individusWithValeursListApiModelSchema,
  type ListIndividusWithValeursQuery,
  type ListSyntheseIndividusQuery,
  type ListValeursForIndicateurQuery,
  type ListValeursRemarquablesForIndicateurQuery,
  type SyntheseIndividusListApiModel,
  syntheseIndividusListApiModelSchema,
  type ValeurAvancementListApiModel,
  valeurAvancementListApiModelSchema,
  type ValeursRemarquablesListApiModel,
  valeursRemarquablesListApiModelSchema,
} from '@pilote/mb-shared/valeurAvancement'

import { apiClient } from '@/api/client'

export const fetchIndicateurs = async (
  params: ListIndicateursQuery,
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
  params: ListIndividusWithValeursQuery,
): Promise<IndividusWithValeursListApiModel> => {
  const json = await apiClient
    .get(`indicateurs/${indicateurId}/individus`, { searchParams: params })
    .json()
  return individusWithValeursListApiModelSchema.parse(json)
}

export const fetchValeursForIndicateur = async (
  indicateurId: string,
  params: ListValeursForIndicateurQuery,
): Promise<ValeurAvancementListApiModel> => {
  const json = await apiClient
    .get(`indicateurs/${indicateurId}/valeurs`, {
      searchParams: {
        individus: params.individus.join(','),
        ...(params.dateDebut ? { dateDebut: params.dateDebut } : {}),
        ...(params.dateFin ? { dateFin: params.dateFin } : {}),
      },
    })
    .json()
  return valeurAvancementListApiModelSchema.parse(json)
}

export const fetchValeursRemarquablesForIndicateur = async (
  indicateurId: string,
  params: ListValeursRemarquablesForIndicateurQuery,
): Promise<ValeursRemarquablesListApiModel> => {
  const json = await apiClient
    .get(`indicateurs/${indicateurId}/valeurs-remarquables`, {
      searchParams: { referentiels: params.referentiels.join(',') },
    })
    .json()
  return valeursRemarquablesListApiModelSchema.parse(json)
}

export const fetchSyntheseIndividus = async (
  indicateurId: string,
  params: ListSyntheseIndividusQuery,
): Promise<SyntheseIndividusListApiModel> => {
  const json = await apiClient
    .get(`indicateurs/${indicateurId}/synthese-individus`, {
      searchParams: { individus: params.individus.join(',') },
    })
    .json()
  return syntheseIndividusListApiModelSchema.parse(json)
}
