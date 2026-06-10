import type { IndividuListApiModel } from '@pilote/mb-shared/individu'
import { individuListApiModelSchema } from '@pilote/mb-shared/individu'
import type {
  ReferentielApiModel,
  ReferentielListApiModel,
  UpsertReferentielBody,
} from '@pilote/mb-shared/referentiel'
import {
  referentielApiModelSchema,
  referentielListApiModelSchema,
} from '@pilote/mb-shared/referentiel'

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
