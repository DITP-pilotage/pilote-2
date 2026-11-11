import type { FinishReason } from 'ai'

import { analyticsEvents, type QuestionSendContext } from '@pilote/kpilote-shared/analytics/events'
import type { AnalyticsEvent } from '@pilote/kpilote-shared/analytics/schema'
import type { PageContext } from '@pilote/kpilote-shared/assistant/chat'
import type { KpiloteUIMessage } from '@pilote/kpilote-shared/assistant/message'

import { isInternalHref } from './internalHref'

export const llmCallIdOf = (message: KpiloteUIMessage | undefined): string | undefined =>
  message?.role === 'assistant' ? message.metadata?.llmCallId : undefined

export const questionType = ({
  messages,
  fromProposition,
}: {
  messages: ReadonlyArray<KpiloteUIMessage>
  fromProposition: boolean
}): QuestionSendContext['type_question'] => {
  if (messages.length > 0) return 'suivante'
  return fromProposition ? 'premiere_proposition' : 'premiere_libre'
}

/**
 * Une question préremplie par une proposition en vient tant qu'elle la complète ; réécrite
 * par-dessus, c'est une saisie.
 */
export const questionOrigin = ({
  text,
  prefill,
}: {
  text: string
  prefill: string | null
}): 'proposition' | 'saisie' =>
  prefill !== null && text.startsWith(prefill.trim()) ? 'proposition' : 'saisie'

/** Un affichage de l'écran vide par conversation et par page : un changement de vue n'en est pas un. */
export const propositionViewKey = ({
  conversationId,
  pageContext,
}: {
  conversationId: string
  pageContext: PageContext | undefined
}): string => `${conversationId}:${JSON.stringify(pageContext ?? {})}`

/**
 * Une réponse arrêtée par l'utilisateur n'est ni aboutie ni en échec : elle a son événement.
 * Seul un flux allé jusqu'à sa fin porte un `finishReason` : sans lui, la réponse a échoué,
 * même quand le SDK ne le signale pas (requête supplantée).
 */
export const answerOutcomeEvent = ({
  conversationId,
  message,
  isAbort,
  isError,
  finishReason,
}: {
  conversationId: string
  message: KpiloteUIMessage
  isAbort: boolean
  isError: boolean
  finishReason: FinishReason | undefined
}): AnalyticsEvent | null => {
  if (isAbort) return null
  if (isError || finishReason === undefined) {
    return analyticsEvents.assistant.answerError({ conversation_id: conversationId })
  }
  return analyticsEvents.assistant.answerComplete({
    conversation_id: conversationId,
    llm_call_id: llmCallIdOf(message),
  })
}

export const choicesPresentedEvent = ({
  conversationId,
  message,
}: {
  conversationId: string
  message: KpiloteUIMessage
}): AnalyticsEvent | null => {
  for (const part of message.parts) {
    if (
      part.type === 'tool-clarify_with_choices' &&
      part.state === 'output-available' &&
      !('error' in part.output)
    ) {
      return analyticsEvents.assistant.responseChoices({
        conversation_id: conversationId,
        llm_call_id: llmCallIdOf(message),
        nombre_choix: part.output.choices.length,
      })
    }
  }
  return null
}

/** Seuls les liens qui mènent à une page sont comptés (pas `mailto:`, `tel:` ni une ancre). */
export const linkEvent = (href: string): AnalyticsEvent | null => {
  if (isInternalHref(href)) {
    return /^\/centre-aide(?:[/?#]|$)/.test(href)
      ? analyticsEvents.assistant.helpCenterLink()
      : analyticsEvents.assistant.linkInternal()
  }
  return /^(?:https?:)?\/\//i.test(href) ? analyticsEvents.assistant.linkExternal() : null
}

export const pageType = (page: PageContext | undefined): 'indicateur' | 'collection' | 'autre' => {
  if (page?.indicateurId) return 'indicateur'
  if (page?.collectionId) return 'collection'
  return 'autre'
}
