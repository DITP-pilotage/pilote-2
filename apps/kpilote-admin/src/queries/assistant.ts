import type { AssistantAcces } from '@pilote/kpilote-shared/assistant/admin'
import { keepPreviousData, queryOptions, useMutation, useQueryClient } from '@tanstack/react-query'

import {
  fetchAssistantAcces,
  fetchAssistantConversation,
  fetchAssistantConversations,
  type ConversationsFiltres,
} from '@/api/assistant'

const ACCES_KEY = ['assistant', 'acces'] as const

export const assistantAccesQueryOptions = () =>
  queryOptions({ queryKey: ACCES_KEY, queryFn: fetchAssistantAcces })

export const assistantConversationsQueryOptions = (filtres: ConversationsFiltres) =>
  queryOptions({
    queryKey: ['assistant', 'conversations', filtres],
    queryFn: () => fetchAssistantConversations(filtres),
    placeholderData: keepPreviousData,
  })

export const assistantConversationQueryOptions = (id: string) =>
  queryOptions({
    queryKey: ['assistant', 'conversations', id],
    queryFn: () => fetchAssistantConversation(id),
  })

// Chaque mutation renvoie l'accès à jour : le cache est remplacé, sans nouvel aller-retour.
export const useAssistantAccesMutation = <V>(
  mutationFn: (variables: V) => Promise<AssistantAcces>,
  options: { onSuccess: () => void; onError: (error: unknown) => void },
) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn,
    onSuccess: (acces) => {
      queryClient.setQueryData(ACCES_KEY, acces)
      options.onSuccess()
    },
    onError: options.onError,
  })
}
