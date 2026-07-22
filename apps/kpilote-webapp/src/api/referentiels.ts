import {
  type IndividuListApiModel,
  individuListApiModelSchema,
} from '@pilote/kpilote-shared/individu'
import {
  type ReferentielApiModel,
  referentielApiModelSchema,
  type ReferentielListApiModel,
  referentielListApiModelSchema,
} from '@pilote/kpilote-shared/referentiel'

import { apiClient } from '@/api/client'

export const fetchReferentiels = async (
  params: { cursor?: string; scope?: string } = {},
): Promise<ReferentielListApiModel> => {
  const json = await apiClient.get('referentiels', { searchParams: params }).json()
  return referentielListApiModelSchema.parse(json)
}

export const fetchReferentielById = async (referentielId: string): Promise<ReferentielApiModel> => {
  const json = await apiClient.get(`referentiels/${referentielId}`).json()
  return referentielApiModelSchema.parse(json)
}

export const fetchIndividusForReferentiel = async (
  referentielId: string,
  params: { cursor?: string } = {},
): Promise<IndividuListApiModel> => {
  const json = await apiClient
    .get(`referentiels/${referentielId}/individus`, { searchParams: params })
    .json()
  return individuListApiModelSchema.parse(json)
}
