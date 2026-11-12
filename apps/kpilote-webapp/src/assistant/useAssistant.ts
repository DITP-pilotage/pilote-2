import { Chat, useChat } from '@ai-sdk/react'
import type { PageContext } from '@pilote/kpilote-shared/assistant/chat'
import type { KpiloteUIMessage } from '@pilote/kpilote-shared/assistant/message'
import { DefaultChatTransport } from 'ai'

import { analytics } from '@/analytics/tracker'
import { tokenStore } from '@/auth/tokenStore'
import { env } from '@/env'

import { remember } from './chatCache'
import { answerOutcomeEvent, choicesPresentedEvent } from './tracking'

// Une conversation survit au démontage du panneau (retour à la palette) : son `Chat` est
// gardé et retrouvé par son identifiant. Seules les plus récentes restent en mémoire : une
// conversation oubliée se recharge depuis l'historique.
const MAX_CHATS = 5
const chats = new Map<string, Chat<KpiloteUIMessage>>()
// Le contexte part avec chaque message : celui de la page affichée au moment de l'envoi.
const contexts = new Map<string, PageContext | undefined>()

// Ce qui est saisi survit au changement de vue, qui remonte le panneau.
const drafts = new Map<string, string>()

// Le début de question posé par une proposition : la question envoyée en vient tant qu'elle
// le complète, même après un changement de vue.
const prefills = new Map<string, string>()

const isBusy = (chat: Chat<KpiloteUIMessage>): boolean =>
  chat.status === 'submitted' || chat.status === 'streaming'

const keep = (conversationId: string, chat: Chat<KpiloteUIMessage>): void => {
  for (const forgotten of remember(chats, conversationId, chat, { max: MAX_CHATS, isBusy })) {
    contexts.delete(forgotten)
    drafts.delete(forgotten)
    prefills.delete(forgotten)
  }
}

const createChat = (conversationId: string, messages: KpiloteUIMessage[] = []) => {
  const chat = new Chat<KpiloteUIMessage>({
    id: conversationId,
    messages,
    onFinish: ({ message, isAbort, isError, finishReason }) => {
      const outcome = answerOutcomeEvent({
        conversationId,
        message,
        isAbort,
        isError,
        finishReason,
      })
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
  keep(conversationId, chat)
  return chat
}

const chatFor = (conversationId: string) => {
  const chat = chats.get(conversationId)
  if (!chat) return createChat(conversationId)
  keep(conversationId, chat)
  return chat
}

/** Reprend une conversation enregistrée : ses messages remplacent ceux gardés en mémoire. */
export const loadChat = (conversationId: string, messages: KpiloteUIMessage[]): void => {
  // L'instance remplacée ne doit pas continuer à recevoir une réponse que plus rien n'affiche.
  void chats.get(conversationId)?.stop()
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

export const prefillOf = (conversationId: string): string | null =>
  prefills.get(conversationId) ?? null

export const setPrefill = (conversationId: string, prefill: string | null): void => {
  if (prefill === null) prefills.delete(conversationId)
  else prefills.set(conversationId, prefill)
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
