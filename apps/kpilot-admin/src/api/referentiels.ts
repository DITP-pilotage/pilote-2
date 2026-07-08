import type { IndividuListApiModel } from '@pilote/kpilot-shared/individu'
import { individuListApiModelSchema } from '@pilote/kpilot-shared/individu'
import type {
  ReferentielApiModel,
  ReferentielListApiModel,
  UpsertReferentielBody,
} from '@pilote/kpilot-shared/referentiel'
import {
  referentielApiModelSchema,
  referentielListApiModelSchema,
} from '@pilote/kpilot-shared/referentiel'

import { bffClient } from '@/api/client'
import { fetchAllPages } from '@/lib/fetchAllPages'

export const fetchReferentiels = async (
  params: { recherche?: string | undefined; cursor?: string | undefined } = {},
): Promise<ReferentielListApiModel> => {
  const searchParams: Record<string, string> = {}
  if (params.recherche) searchParams.recherche = params.recherche
  if (params.cursor) searchParams.cursor = params.cursor
  const json = await bffClient.get('referentiels', { searchParams }).json()
  return referentielListApiModelSchema.parse(json)
}

export const fetchAllReferentiels = (
  params: { recherche?: string } = {},
): Promise<ReferentielApiModel[]> =>
  fetchAllPages((cursor) => fetchReferentiels({ recherche: params.recherche, cursor }))

export const fetchReferentielById = async (id: string): Promise<ReferentielApiModel> => {
  const json = await bffClient.get(`referentiels/${id}`).json()
  return referentielApiModelSchema.parse(json)
}

export const fetchIndividusForReferentiel = async (
  id: string,
  params: { cursor?: string | undefined } = {},
): Promise<IndividuListApiModel> => {
  const searchParams: Record<string, string> = {}
  if (params.cursor) searchParams.cursor = params.cursor
  const json = await bffClient.get(`referentiels/${id}/individus`, { searchParams }).json()
  return individuListApiModelSchema.parse(json)
}

export const upsertReferentiel = async (
  id: string,
  body: UpsertReferentielBody,
): Promise<ReferentielApiModel> => {
  const json = await bffClient.put(`referentiels/${id}`, { json: body }).json()
  return referentielApiModelSchema.parse(json)
}
