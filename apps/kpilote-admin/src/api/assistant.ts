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

export type ConversationsFilters = {
  page: number
  recherche?: string | undefined
  positif?: boolean | undefined
  negatif?: boolean | undefined
  commentaire?: boolean | undefined
  categorie?: IssueCategory | undefined
}

export const fetchAssistantAcces = async (): Promise<AssistantAcces> =>
  assistantAccesSchema.parse(await bffClient.get('assistant/admin/acces').json())

export const setAssistantActif = async (actif: boolean): Promise<AssistantAcces> =>
  assistantAccesSchema.parse(
    await bffClient.put('assistant/admin/acces/actif', { json: { actif } }).json(),
  )

export const grantAssistantAccess = async (utilisateurId: string): Promise<AssistantAcces> =>
  assistantAccesSchema.parse(
    await bffClient.put(`assistant/admin/acces/utilisateurs/${utilisateurId}`).json(),
  )

export const revokeAssistantAccess = async (utilisateurId: string): Promise<AssistantAcces> =>
  assistantAccesSchema.parse(
    await bffClient.delete(`assistant/admin/acces/utilisateurs/${utilisateurId}`).json(),
  )

const toSearchParams = (filters: ConversationsFilters): URLSearchParams => {
  const params = new URLSearchParams({ page: String(filters.page) })
  if (filters.recherche) params.set('recherche', filters.recherche)
  if (filters.positif) params.set('positif', 'true')
  if (filters.negatif) params.set('negatif', 'true')
  if (filters.commentaire) params.set('commentaire', 'true')
  if (filters.categorie) params.set('categorie', filters.categorie)
  return params
}

export const fetchAssistantConversations = async (
  filters: ConversationsFilters,
): Promise<AdminConversationList> =>
  adminConversationListSchema.parse(
    await bffClient
      .get('assistant/admin/conversations', { searchParams: toSearchParams(filters) })
      .json(),
  )

export const fetchAssistantConversation = async (id: string): Promise<AdminConversation> =>
  adminConversationSchema.parse(await bffClient.get(`assistant/admin/conversations/${id}`).json())
