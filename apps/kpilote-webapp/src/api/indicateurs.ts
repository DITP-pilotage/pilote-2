import {
  type IndicateurApiModel,
  indicateurApiModelSchema,
  type IndicateurListApiModel,
  indicateurListApiModelSchema,
  type ListIndicateursQuery,
} from '@pilote/kpilote-shared/indicateur'
import {
  type ListTauxProgressionQuery,
  type TauxProgressionListApiModel,
  tauxProgressionListApiModelSchema,
} from '@pilote/kpilote-shared/tauxProgression'
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
} from '@pilote/kpilote-shared/valeurAvancement'

import { apiClient } from '@/api/client'

export const fetchIndicateurs = async (
  params: ListIndicateursQuery,
): Promise<IndicateurListApiModel> => {
  // ky filters out `undefined` values from object-form searchParams (see
  // Ky.#normalizeSearchParams). Le filtre `ids` est CSV côté API : on le
  // sérialise explicitement, sinon ky le rendrait en multi-value `?ids=a&ids=b`.
  const { ids, ...rest } = params
  const searchParams = {
    ...rest,
    ...(ids && ids.length > 0 ? { ids: ids.join(',') } : {}),
  }
  const json = await apiClient.get('indicateurs', { searchParams }).json()
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
        ...(params.dateTrunc ? { dateTrunc: params.dateTrunc } : {}),
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
      searchParams: {
        referentiels: params.referentiels.join(','),
        ...(params.dateTrunc ? { dateTrunc: params.dateTrunc } : {}),
      },
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
      searchParams: {
        individus: params.individus.join(','),
        ...(params.dateTrunc ? { dateTrunc: params.dateTrunc } : {}),
      },
    })
    .json()
  return syntheseIndividusListApiModelSchema.parse(json)
}

export const fetchTauxProgressionForIndicateur = async (
  indicateurId: string,
  params: ListTauxProgressionQuery,
): Promise<TauxProgressionListApiModel> => {
  const json = await apiClient
    .get(`indicateurs/${indicateurId}/taux-progression`, {
      searchParams: {
        individus: params.individus.join(','),
        ...(params.dateDebut ? { dateDebut: params.dateDebut } : {}),
        ...(params.dateFin ? { dateFin: params.dateFin } : {}),
      },
    })
    .json()
  return tauxProgressionListApiModelSchema.parse(json)
}
