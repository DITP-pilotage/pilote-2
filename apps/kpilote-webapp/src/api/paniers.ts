import {
  type ListPaniersQuery,
  type PanierApiModel,
  panierApiModelSchema,
  type PanierListApiModel,
  panierListApiModelSchema,
} from '@pilote/kpilote-shared/panier'
import {
  type PanierTauxProgressionApiModel,
  panierTauxProgressionApiModelSchema,
  type PanierTauxProgressionSummaryListApiModel,
  panierTauxProgressionSummaryListApiModelSchema,
} from '@pilote/kpilote-shared/panierTauxProgression'

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

export const fetchPanierTauxProgressionForIndividu = async (
  individuId: string,
  panierIds: string[],
): Promise<PanierTauxProgressionSummaryListApiModel> => {
  const json = await apiClient
    .get(`individus/${individuId}/taux-progression/paniers`, {
      searchParams: { paniers: panierIds.join(',') },
    })
    .json()
  return panierTauxProgressionSummaryListApiModelSchema.parse(json)
}
