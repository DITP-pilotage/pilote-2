import type {
  CreateUtilisateurBody,
  UpdateUtilisateurBody,
  UtilisateurApiModel,
  UtilisateurListApiModel,
} from '@pilote/mb-shared/utilisateur'
import {
  utilisateurApiModelSchema,
  utilisateurListApiModelSchema,
} from '@pilote/mb-shared/utilisateur'

import { bffClient } from '@/api/client'

export const fetchUtilisateurs = async (): Promise<UtilisateurListApiModel> => {
  const json = await bffClient.get('utilisateurs').json()
  return utilisateurListApiModelSchema.parse(json)
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
