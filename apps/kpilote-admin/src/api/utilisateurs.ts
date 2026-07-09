import type {
  CreateUtilisateurBody,
  UpdateUtilisateurBody,
  UtilisateurApiModel,
  UtilisateurListApiModel,
} from '@pilote/kpilote-shared/utilisateur'
import {
  utilisateurApiModelSchema,
  utilisateurListApiModelSchema,
} from '@pilote/kpilote-shared/utilisateur'

import { bffClient } from '@/api/client'
import { fetchAllPages } from '@/lib/fetchAllPages'

export const fetchUtilisateurs = async (
  params: { recherche?: string | undefined; cursor?: string | undefined } = {},
): Promise<UtilisateurListApiModel> => {
  const searchParams: Record<string, string> = {}
  if (params.recherche) searchParams.recherche = params.recherche
  if (params.cursor) searchParams.cursor = params.cursor
  const json = await bffClient.get('utilisateurs', { searchParams }).json()
  return utilisateurListApiModelSchema.parse(json)
}

export const fetchAllUtilisateurs = (): Promise<UtilisateurApiModel[]> =>
  fetchAllPages((cursor) => fetchUtilisateurs({ cursor }))

export const fetchUtilisateurById = async (id: string): Promise<UtilisateurApiModel> => {
  const json = await bffClient.get(`utilisateurs/${id}`).json()
  return utilisateurApiModelSchema.parse(json)
}

export const createUtilisateur = async (
  body: CreateUtilisateurBody,
): Promise<UtilisateurApiModel> => {
  const json = await bffClient.post('utilisateurs', { json: body }).json()
  return utilisateurApiModelSchema.parse(json)
}

export const updateUtilisateur = async (
  id: string,
  body: UpdateUtilisateurBody,
): Promise<UtilisateurApiModel> => {
  const json = await bffClient.patch(`utilisateurs/${id}`, { json: body }).json()
  return utilisateurApiModelSchema.parse(json)
}
