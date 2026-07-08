import type {
  CreateUtilisateurBody,
  UpdateUtilisateurBody,
  UtilisateurApiModel,
  UtilisateurListApiModel,
} from '@pilote/kpilot-shared/utilisateur'
import {
  utilisateurApiModelSchema,
  utilisateurListApiModelSchema,
} from '@pilote/kpilot-shared/utilisateur'

import { bffClient } from '@/api/client'

export const fetchUtilisateurs = async (
  params: { recherche?: string | undefined; cursor?: string | undefined } = {},
): Promise<UtilisateurListApiModel> => {
  const searchParams: Record<string, string> = {}
  if (params.recherche) searchParams.recherche = params.recherche
  if (params.cursor) searchParams.cursor = params.cursor
  const json = await bffClient.get('utilisateurs', { searchParams }).json()
  return utilisateurListApiModelSchema.parse(json)
}

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
