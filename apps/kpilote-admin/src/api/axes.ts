import {
  axeApiModelSchema,
  axeListApiModelSchema,
  modaliteApiModelSchema,
  modaliteListApiModelSchema,
  type AxeApiModel,
  type AxeListApiModel,
  type ModaliteApiModel,
  type UpsertAxeBody,
  type UpsertModaliteBody,
} from '@pilote/kpilote-shared/axe'

import { bffClient } from '@/api/client'
import { fetchAllPages } from '@/lib/fetchAllPages'

export const fetchAxes = async (
  params: { recherche?: string | undefined; cursor?: string | undefined } = {},
): Promise<AxeListApiModel> => {
  const searchParams: Record<string, string> = {}
  if (params.recherche) searchParams.recherche = params.recherche
  if (params.cursor) searchParams.cursor = params.cursor
  return axeListApiModelSchema.parse(await bffClient.get('axes', { searchParams }).json())
}

export const fetchAllAxes = (): Promise<AxeApiModel[]> =>
  fetchAllPages((cursor) => fetchAxes({ cursor }))

export const fetchAxeById = async (id: string): Promise<AxeApiModel> =>
  axeApiModelSchema.parse(await bffClient.get(`axes/${id}`).json())

export const upsertAxe = async ({
  id,
  body,
}: {
  id: string
  body: UpsertAxeBody
}): Promise<AxeApiModel> =>
  axeApiModelSchema.parse(await bffClient.put(`axes/${id}`, { json: body }).json())

export const fetchModalites = async (axeId: string): Promise<ModaliteApiModel[]> =>
  modaliteListApiModelSchema.parse(await bffClient.get(`axes/${axeId}/modalites`).json()).items

export const upsertModalite = async ({
  axeId,
  id,
  body,
}: {
  axeId: string
  id: string
  body: UpsertModaliteBody
}): Promise<ModaliteApiModel> =>
  modaliteApiModelSchema.parse(
    await bffClient.put(`axes/${axeId}/modalites/${id}`, { json: body }).json(),
  )

export const deleteModalite = async ({
  axeId,
  id,
}: {
  axeId: string
  id: string
}): Promise<void> => {
  await bffClient.delete(`axes/${axeId}/modalites/${id}`)
}
