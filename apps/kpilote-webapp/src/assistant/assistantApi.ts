import {
  conversationListSchema,
  conversationSchema,
  type Conversation,
} from '@pilote/kpilote-shared/assistant/conversation'
import type { RateBody } from '@pilote/kpilote-shared/assistant/feedback'
import { queryOptions } from '@tanstack/react-query'
import { z } from 'zod'

import { apiClient } from '@/api/client'
import { DEFAULT_STALE_TIME } from '@/queries/utils'

const accessSchema = z.object({ allowed: z.boolean() })

export const assistantAccessQueryOptions = () =>
  queryOptions({
    queryKey: ['assistant', 'acces'],
    queryFn: async () => accessSchema.parse(await apiClient.get('assistant/acces').json()),
    staleTime: DEFAULT_STALE_TIME,
  })

export const rateCall = async ({
  llmCallId,
  body,
}: {
  llmCallId: string
  body: RateBody
}): Promise<void> => {
  await apiClient.post(`assistant/appels/${llmCallId}/evaluation`, { json: body })
}

export const conversationsQueryOptions = () =>
  queryOptions({
    queryKey: ['assistant', 'conversations'],
    queryFn: async () =>
      conversationListSchema.parse(await apiClient.get('assistant/conversations').json()).items,
    // Relue à chaque ouverture de l'historique : une réponse a pu la changer entre-temps.
    staleTime: 0,
  })

/** Une conversation enregistrée, ou `null` si elle n'existe pas (jamais enregistrée, supprimée). */
export const fetchConversation = async (id: string): Promise<Conversation | null> => {
  const response = await apiClient.get(`assistant/conversations/${id}`, {
    throwHttpErrors: false,
  })
  if (response.status === 404) return null
  if (!response.ok) throw new Error(`Conversation illisible (${response.status})`)
  return conversationSchema.parse(await response.json())
}

export const deleteConversation = async (id: string): Promise<void> => {
  await apiClient.delete(`assistant/conversations/${id}`)
}
