import {
  type ListPaniersQuery,
  type PanierApiModel,
  panierApiModelSchema,
  type PanierListApiModel,
  panierListApiModelSchema,
} from '@pilote/mb-shared/panier'

import { apiClient } from '@/api/client'

export const fetchPaniers = async (params: ListPaniersQuery): Promise<PanierListApiModel> => {
  const json = await apiClient.get('paniers', { searchParams: params }).json()
  return panierListApiModelSchema.parse(json)
}

export const fetchPanierById = async (id: string): Promise<PanierApiModel> => {
  const json = await apiClient.get(`paniers/${id}`).json()
  return panierApiModelSchema.parse(json)
}
