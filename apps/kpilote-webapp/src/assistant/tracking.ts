import { analyticsEvents, type QuestionSendContext } from '@pilote/kpilote-shared/analytics/events'
import type { AnalyticsEvent } from '@pilote/kpilote-shared/analytics/schema'
import type { PageContext } from '@pilote/kpilote-shared/assistant/chat'
import type { KpiloteUIMessage } from '@pilote/kpilote-shared/assistant/message'

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

/** Une réponse arrêtée par l'utilisateur n'est ni aboutie ni en échec : elle a son événement. */
export const answerOutcomeEvent = ({
  conversationId,
  message,
  isAbort,
  isError,
}: {
  conversationId: string
  message: KpiloteUIMessage
  isAbort: boolean
  isError: boolean
}): AnalyticsEvent | null => {
  if (isAbort) return null
  if (isError) return analyticsEvents.assistant.answerError({ conversation_id: conversationId })
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

/** Seuls les liens qui mènent à une page sont comptés (pas `mailto:` ni `tel:`). */
export const linkEvent = (href: string): AnalyticsEvent | null => {
  if (/^(mailto|tel):/i.test(href)) return null
  if (href.startsWith('/centre-aide')) return analyticsEvents.assistant.helpCenterLink()
  return href.startsWith('/') && !href.startsWith('//')
    ? analyticsEvents.assistant.linkInternal()
    : analyticsEvents.assistant.linkExternal()
}

export const pageType = (page: PageContext | undefined): 'indicateur' | 'collection' | 'autre' => {
  if (page?.indicateurId) return 'indicateur'
  if (page?.collectionId) return 'collection'
  return 'autre'
}
