import {
  type CreerNiveauConfianceBody,
  type ModifierNiveauConfianceBody,
  type NiveauConfianceApiModel,
  niveauConfianceApiModelSchema,
  type NiveauConfianceListApiModel,
  niveauConfianceListApiModelSchema,
} from '@pilote/mb-shared/niveauConfiance'
import { type PaginateQuery } from '@pilote/mb-shared/pagination'

import { apiClient } from '@/api/client'

export const fetchHistoriqueNiveauConfiance = async (
  indicateurId: string,
  individuId: string,
  query: PaginateQuery,
): Promise<NiveauConfianceListApiModel> => {
  const json = await apiClient
    .get(`indicateurs/${indicateurId}/individus/${individuId}/niveau-confiance/historique`, {
      searchParams: query,
    })
    .json()
  return niveauConfianceListApiModelSchema.parse(json)
}

export const createNiveauConfiance = async (
  body: CreerNiveauConfianceBody,
): Promise<NiveauConfianceApiModel> => {
  const json = await apiClient.post('niveau-confiance', { json: body }).json()
  return niveauConfianceApiModelSchema.parse(json)
}

export const updateNiveauConfiance = async (
  niveauConfianceId: string,
  body: ModifierNiveauConfianceBody,
): Promise<NiveauConfianceApiModel> => {
  const json = await apiClient.put(`niveau-confiance/${niveauConfianceId}`, { json: body }).json()
  return niveauConfianceApiModelSchema.parse(json)
}
