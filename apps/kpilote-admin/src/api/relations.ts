import type {
  RelationApiModel,
  RelationListApiModel,
  UpsertRelationBody,
} from '@pilote/kpilote-shared/relation'
import { relationApiModelSchema, relationListApiModelSchema } from '@pilote/kpilote-shared/relation'

import { bffClient } from '@/api/client'
import { fetchAllPages } from '@/lib/fetchAllPages'

export const fetchRelations = async (
  params: { recherche?: string | undefined; cursor?: string | undefined } = {},
): Promise<RelationListApiModel> => {
  const searchParams: Record<string, string> = {}
  if (params.recherche) searchParams.recherche = params.recherche
  if (params.cursor) searchParams.cursor = params.cursor
  const json = await bffClient.get('relations', { searchParams }).json()
  return relationListApiModelSchema.parse(json)
}

export const fetchAllRelations = (): Promise<RelationApiModel[]> =>
  fetchAllPages((cursor) => fetchRelations(cursor ? { cursor } : {}))

export const upsertRelationParent = async (
  id: string,
  body: UpsertRelationBody,
): Promise<RelationApiModel> => {
  const json = await bffClient.put(`relations/${id}`, { json: body }).json()
  return relationApiModelSchema.parse(json)
}

// Pas de `.json()` : la réponse est un 204 sans corps.
export const supprimerRelation = async (id: string): Promise<void> => {
  await bffClient.delete(`relations/${id}`)
}
