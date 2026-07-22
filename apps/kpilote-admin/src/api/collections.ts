import type { CollectionListApiModel } from '@pilote/kpilote-shared/collection'
import { collectionListApiModelSchema } from '@pilote/kpilote-shared/collection'

import { bffClient } from '@/api/client'

export type ListCollectionsParams = {
  recherche?: string | undefined
  rechercheIdentifiant?: string | undefined
  cursor?: string | undefined
}

export const fetchCollections = async (
  params: ListCollectionsParams,
): Promise<CollectionListApiModel> => {
  const searchParams: Record<string, string> = {}
  if (params.recherche) searchParams.recherche = params.recherche
  if (params.rechercheIdentifiant) searchParams.rechercheIdentifiant = params.rechercheIdentifiant
  if (params.cursor) searchParams.cursor = params.cursor
  const json = await bffClient.get('collections', { searchParams }).json()
  return collectionListApiModelSchema.parse(json)
}
