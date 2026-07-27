import type { IndividuApiModel, IndividuListApiModel } from '@pilote/kpilote-shared/individu'
import { individuListApiModelSchema } from '@pilote/kpilote-shared/individu'

import { bffClient } from '@/api/client'
import { fetchAllPages } from '@/lib/fetchAllPages'

export const fetchIndividus = async (
  params: { cursor?: string | undefined } = {},
): Promise<IndividuListApiModel> => {
  const searchParams: Record<string, string> = {}
  if (params.cursor) searchParams.cursor = params.cursor
  const json = await bffClient.get('individus', { searchParams }).json()
  return individuListApiModelSchema.parse(json)
}

export const fetchAllIndividus = (): Promise<IndividuApiModel[]> =>
  fetchAllPages((cursor) => fetchIndividus(cursor ? { cursor } : {}))
