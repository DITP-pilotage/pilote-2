import type { ReferentielListApiModel } from '@pilote/mb-shared/referentiel'
import { referentielListApiModelSchema } from '@pilote/mb-shared/referentiel'

import { bffClient } from '@/api/client'

export const fetchReferentiels = async (
  params: { recherche?: string | undefined; cursor?: string | undefined } = {},
): Promise<ReferentielListApiModel> => {
  const searchParams: Record<string, string> = {}
  if (params.recherche) searchParams.recherche = params.recherche
  if (params.cursor) searchParams.cursor = params.cursor
  const json = await bffClient.get('referentiels', { searchParams }).json()
  return referentielListApiModelSchema.parse(json)
}
