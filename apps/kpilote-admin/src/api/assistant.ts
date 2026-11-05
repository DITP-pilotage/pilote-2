import {
  adminConversationListSchema,
  adminConversationSchema,
  assistantAccesSchema,
  type AdminConversation,
  type AdminConversationList,
  type AssistantAcces,
} from '@pilote/kpilote-shared/assistant/admin'
import type { IssueCategory } from '@pilote/kpilote-shared/assistant/feedback'

import { bffClient } from '@/api/client'

export type ConversationsFiltres = {
  page: number
  recherche?: string | undefined
  positif?: boolean | undefined
  negatif?: boolean | undefined
  commentaire?: boolean | undefined
  categorie?: IssueCategory | undefined
}

export const fetchAssistantAcces = async (): Promise<AssistantAcces> =>
  assistantAccesSchema.parse(await bffClient.get('assistant/admin/acces').json())

export const modifierAssistantActif = async (actif: boolean): Promise<AssistantAcces> =>
  assistantAccesSchema.parse(
    await bffClient.put('assistant/admin/acces/actif', { json: { actif } }).json(),
  )

export const autoriserAssistantUtilisateur = async (
  utilisateurId: string,
): Promise<AssistantAcces> =>
  assistantAccesSchema.parse(
    await bffClient.put(`assistant/admin/acces/utilisateurs/${utilisateurId}`).json(),
  )

export const retirerAssistantUtilisateur = async (utilisateurId: string): Promise<AssistantAcces> =>
  assistantAccesSchema.parse(
    await bffClient.delete(`assistant/admin/acces/utilisateurs/${utilisateurId}`).json(),
  )

const toSearchParams = (filtres: ConversationsFiltres): URLSearchParams => {
  const params = new URLSearchParams({ page: String(filtres.page) })
  if (filtres.recherche) params.set('recherche', filtres.recherche)
  if (filtres.positif) params.set('positif', 'true')
  if (filtres.negatif) params.set('negatif', 'true')
  if (filtres.commentaire) params.set('commentaire', 'true')
  if (filtres.categorie) params.set('categorie', filtres.categorie)
  return params
}

export const fetchAssistantConversations = async (
  filtres: ConversationsFiltres,
): Promise<AdminConversationList> =>
  adminConversationListSchema.parse(
    await bffClient
      .get('assistant/admin/conversations', { searchParams: toSearchParams(filtres) })
      .json(),
  )

export const fetchAssistantConversation = async (id: string): Promise<AdminConversation> =>
  adminConversationSchema.parse(await bffClient.get(`assistant/admin/conversations/${id}`).json())
