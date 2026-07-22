import {
  type ListCollectionsQuery,
  type CollectionApiModel,
  collectionApiModelSchema,
  type CollectionListApiModel,
  collectionListApiModelSchema,
} from '@pilote/kpilote-shared/collection'
import {
  type CollectionTauxProgressionApiModel,
  collectionTauxProgressionApiModelSchema,
  type CollectionTauxProgressionSummaryListApiModel,
  collectionTauxProgressionSummaryListApiModelSchema,
} from '@pilote/kpilote-shared/collectionTauxProgression'

import { apiClient } from '@/api/client'

export const fetchCollections = async (
  params: ListCollectionsQuery,
): Promise<CollectionListApiModel> => {
  const json = await apiClient.get('collections', { searchParams: params }).json()
  return collectionListApiModelSchema.parse(json)
}

export const fetchCollectionById = async (id: string): Promise<CollectionApiModel> => {
  const json = await apiClient.get(`collections/${id}`).json()
  return collectionApiModelSchema.parse(json)
}

export const fetchCollectionTauxProgression = async ({
  collectionId,
  individu,
}: {
  collectionId: string
  individu: string
}): Promise<CollectionTauxProgressionApiModel> => {
  const json = await apiClient
    .get(`collections/${collectionId}/taux-progression`, { searchParams: { individu } })
    .json()
  return collectionTauxProgressionApiModelSchema.parse(json)
}

export const fetchCollectionTauxProgressionForIndividu = async (
  individuId: string,
  collectionIds: string[],
): Promise<CollectionTauxProgressionSummaryListApiModel> => {
  const json = await apiClient
    .get(`individus/${individuId}/taux-progression/collections`, {
      searchParams: { collections: collectionIds.join(',') },
    })
    .json()
  return collectionTauxProgressionSummaryListApiModelSchema.parse(json)
}
