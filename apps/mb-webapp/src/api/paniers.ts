import {
  type ListPaniersQuery,
  type PanierApiModel,
  panierApiModelSchema,
  type PanierListApiModel,
  panierListApiModelSchema,
} from '@pilote/mb-shared/panier'
import {
  type PanierContactsUtilesApiModel,
  panierContactsUtilesApiModelSchema,
} from '@pilote/mb-shared/panierContactUtile'
import {
  type PanierTauxProgressionApiModel,
  panierTauxProgressionApiModelSchema,
} from '@pilote/mb-shared/panierTauxProgression'

import { apiClient } from '@/api/client'

export const fetchPaniers = async (params: ListPaniersQuery): Promise<PanierListApiModel> => {
  const json = await apiClient.get('paniers', { searchParams: params }).json()
  return panierListApiModelSchema.parse(json)
}

export const fetchPanierById = async (id: string): Promise<PanierApiModel> => {
  const json = await apiClient.get(`paniers/${id}`).json()
  return panierApiModelSchema.parse(json)
}

export const fetchPanierTauxProgression = async ({
  panierId,
  individu,
}: {
  panierId: string
  individu: string
}): Promise<PanierTauxProgressionApiModel> => {
  const json = await apiClient
    .get(`paniers/${panierId}/taux-progression`, { searchParams: { individu } })
    .json()
  return panierTauxProgressionApiModelSchema.parse(json)
}

export const fetchPanierContactsUtiles = async (
  panierId: string,
): Promise<PanierContactsUtilesApiModel> => {
  const json = await apiClient.get(`paniers/${panierId}/contacts-utiles`).json()
  return panierContactsUtilesApiModelSchema.parse(json)
}
