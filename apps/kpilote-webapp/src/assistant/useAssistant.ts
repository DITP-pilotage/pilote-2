import { Chat, useChat } from '@ai-sdk/react'
import type { PageContext } from '@pilote/kpilote-shared/assistant/chat'
import type { KpiloteUIMessage } from '@pilote/kpilote-shared/assistant/message'
import { DefaultChatTransport } from 'ai'

import { tokenStore } from '@/auth/tokenStore'
import { env } from '@/env'

// Une conversation survit au démontage du panneau (retour à la palette) : son `Chat` est
// gardé tant que l'onglet vit, et retrouvé par son identifiant.
const chats = new Map<string, Chat<KpiloteUIMessage>>()

const chatFor = (conversationId: string, pageContext: PageContext | undefined) => {
  const existing = chats.get(conversationId)
  if (existing) return existing
  const chat = new Chat<KpiloteUIMessage>({
    id: conversationId,
    transport: new DefaultChatTransport<KpiloteUIMessage>({
      api: `${env.apiUrl}/assistant/chat`,
      // Le serveur possède l'historique : seul le nouveau message part.
      prepareSendMessagesRequest: ({ messages }) => ({
        body: { id: conversationId, message: messages.at(-1), context: pageContext },
      }),
      // Le jeton est relu à chaque envoi : il tourne.
      headers: () => {
        const token = tokenStore.get()
        return token ? { Authorization: `Bearer ${token}` } : {}
      },
    }),
  })
  chats.set(conversationId, chat)
  return chat
}

export const useAssistant = ({
  conversationId,
  pageContext,
}: {
  conversationId: string
  pageContext: PageContext | undefined
}) =>
  // Le throttle évite un rendu par token : le flux arrive plus vite que React ne peint.
  useChat<KpiloteUIMessage>({
    chat: chatFor(conversationId, pageContext),
    experimental_throttle: 250,
  })
