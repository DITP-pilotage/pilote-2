import type {
  DimensionApiModel,
  DimensionListApiModel,
  UpsertDimensionBody,
} from '@pilote/kpilote-shared/dimension'
import {
  dimensionApiModelSchema,
  dimensionListApiModelSchema,
} from '@pilote/kpilote-shared/dimension'

import { bffClient } from '@/api/client'
import { fetchAllPages } from '@/lib/fetchAllPages'

export const fetchDimensions = async (
  params: { cursor?: string | undefined } = {},
): Promise<DimensionListApiModel> => {
  const searchParams: Record<string, string> = {}
  if (params.cursor) searchParams.cursor = params.cursor
  const json = await bffClient.get('dimensions', { searchParams }).json()
  return dimensionListApiModelSchema.parse(json)
}

export const fetchAllDimensions = (): Promise<DimensionApiModel[]> =>
  fetchAllPages((cursor) => fetchDimensions(cursor ? { cursor } : {}))

export const fetchDimensionById = async (id: string): Promise<DimensionApiModel> => {
  const json = await bffClient.get(`dimensions/${id}`).json()
  return dimensionApiModelSchema.parse(json)
}

export const upsertDimension = async (
  id: string,
  body: UpsertDimensionBody,
): Promise<DimensionApiModel> => {
  const json = await bffClient.put(`dimensions/${id}`, { json: body }).json()
  return dimensionApiModelSchema.parse(json)
}
