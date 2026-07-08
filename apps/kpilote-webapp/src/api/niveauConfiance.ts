import {
  type CreerNiveauConfianceBody,
  type ModifierNiveauConfianceBody,
  type NiveauConfianceApiModel,
  niveauConfianceApiModelSchema,
  type NiveauConfianceListApiModel,
  niveauConfianceListApiModelSchema,
} from '@pilote/kpilote-shared/niveauConfiance'

import { apiClient } from '@/api/client'

// Récupère les niveaux de confiance associés aux commentaires passés (CSV d'ids).
export const fetchNiveauxParCommentaires = async (
  indicateurId: string,
  individuId: string,
  commentaireIds: string[],
): Promise<NiveauConfianceListApiModel> => {
  const json = await apiClient
    .get(`indicateurs/${indicateurId}/individus/${individuId}/niveaux-confiance`, {
      searchParams: { commentaires: commentaireIds.join(',') },
    })
    .json()
  return niveauConfianceListApiModelSchema.parse(json)
}

// Variante panier global — même contrat, route propre.
export const fetchNiveauxParCommentairesPanier = async (
  panierId: string,
  commentaireIds: string[],
): Promise<NiveauConfianceListApiModel> => {
  const json = await apiClient
    .get(`paniers/${panierId}/niveaux-confiance`, {
      searchParams: { commentaires: commentaireIds.join(',') },
    })
    .json()
  return niveauConfianceListApiModelSchema.parse(json)
}

export const createNiveauConfiance = async (
  body: CreerNiveauConfianceBody,
): Promise<NiveauConfianceApiModel> => {
  const json = await apiClient.post('niveaux-confiance', { json: body }).json()
  return niveauConfianceApiModelSchema.parse(json)
}

export const updateNiveauConfiance = async (
  niveauConfianceId: string,
  body: ModifierNiveauConfianceBody,
): Promise<NiveauConfianceApiModel> => {
  const json = await apiClient.put(`niveaux-confiance/${niveauConfianceId}`, { json: body }).json()
  return niveauConfianceApiModelSchema.parse(json)
}
