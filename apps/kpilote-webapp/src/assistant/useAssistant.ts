import { Chat, useChat } from '@ai-sdk/react'
import type { PageContext } from '@pilote/kpilote-shared/assistant/chat'
import type { KpiloteUIMessage } from '@pilote/kpilote-shared/assistant/message'
import { DefaultChatTransport } from 'ai'

import { analytics } from '@/analytics/tracker'
import { tokenStore } from '@/auth/tokenStore'
import { env } from '@/env'

import { answerOutcomeEvent, choicesPresentedEvent } from './tracking'

// Une conversation survit au démontage du panneau (retour à la palette) : son `Chat` est
// gardé tant que l'onglet vit, et retrouvé par son identifiant.
const chats = new Map<string, Chat<KpiloteUIMessage>>()
// Le contexte part avec chaque message : celui de la page affichée au moment de l'envoi.
const contexts = new Map<string, PageContext | undefined>()

// Ce qui est saisi survit au changement de vue, qui remonte le panneau.
const drafts = new Map<string, string>()

const createChat = (conversationId: string, messages: KpiloteUIMessage[] = []) => {
  const chat = new Chat<KpiloteUIMessage>({
    id: conversationId,
    messages,
    onFinish: ({ message, isAbort, isError }) => {
      const outcome = answerOutcomeEvent({ conversationId, message, isAbort, isError })
      if (outcome) analytics.trackEvent(outcome)
      const choices = isAbort ? null : choicesPresentedEvent({ conversationId, message })
      if (choices) analytics.trackEvent(choices)
    },
    transport: new DefaultChatTransport<KpiloteUIMessage>({
      api: `${env.apiUrl}/assistant/chat`,
      // Le serveur possède l'historique : seul le nouveau message part.
      prepareSendMessagesRequest: ({ messages }) => ({
        body: {
          id: conversationId,
          message: messages.at(-1),
          context: contexts.get(conversationId),
        },
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

const chatFor = (conversationId: string) => chats.get(conversationId) ?? createChat(conversationId)

/** Reprend une conversation enregistrée : ses messages remplacent ceux gardés en mémoire. */
export const loadChat = (conversationId: string, messages: KpiloteUIMessage[]): void => {
  createChat(conversationId, messages)
}

/** Arrête la réponse en cours, avant de quitter une conversation pour une autre. */
export const stopChat = (conversationId: string): void => {
  void chats.get(conversationId)?.stop()
}

export const readDraft = (conversationId: string): string => drafts.get(conversationId) ?? ''

export const writeDraft = (conversationId: string, text: string): void => {
  drafts.set(conversationId, text)
}

// Un brouillon pré-rempli par une proposition : la question envoyée en vient, même après un
// changement de vue.
const prefilledDrafts = new Set<string>()

export const isPrefilled = (conversationId: string): boolean => prefilledDrafts.has(conversationId)

export const setPrefilled = (conversationId: string, prefilled: boolean): void => {
  if (prefilled) prefilledDrafts.add(conversationId)
  else prefilledDrafts.delete(conversationId)
}

/** L'état d'une conversation sans l'envoyer : pour l'en-tête et la pastille. */
export const useConversationState = (conversationId: string) =>
  useChat<KpiloteUIMessage>({ chat: chatFor(conversationId), experimental_throttle: 250 })

export const useAssistant = ({
  conversationId,
  pageContext,
}: {
  conversationId: string
  pageContext: PageContext | undefined
}) => {
  contexts.set(conversationId, pageContext)
  // Le throttle évite un rendu par token : le flux arrive plus vite que React ne peint.
  return useChat<KpiloteUIMessage>({ chat: chatFor(conversationId), experimental_throttle: 250 })
}
