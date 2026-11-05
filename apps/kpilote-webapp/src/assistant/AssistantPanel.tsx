import { analyticsEvents, type QuestionSendContext } from '@pilote/kpilote-shared/analytics/events'
import type { PageContext } from '@pilote/kpilote-shared/assistant/chat'
import { Button } from '@pilote/kpilote-ui/Button'
import { FieldTextarea } from '@pilote/kpilote-ui/FieldTextarea'
import { IconButton } from '@pilote/kpilote-ui/IconButton'
import { clsxm } from '@pilote/kpilote-ui/clsxm'
import { useQueryClient } from '@tanstack/react-query'
import { ArrowDown, Mic, Square } from 'lucide-react'
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'

import { analytics } from '@/analytics/tracker'

import { AssistantMessage, UserMessage } from './AssistantMessage'
import { assistantAccessQueryOptions } from './assistantApi'
import { AssistantSignature } from './AssistantSignature'
import { deriveAssistantState } from './deriveAssistantState'
import { EmptyState } from './emptyState/EmptyState'
import { propositionsFor, type Proposition } from './emptyState/propositions'
import { isNearBottom } from './followResponse'
import { questionToSend, type PendingQuestion } from './pendingQuestion'
import { pageType, propositionViewKey, questionOrigin, questionType } from './tracking'
import { appendTranscript } from './transcript'
import { prefillOf, readDraft, setPrefill, useAssistant, writeDraft } from './useAssistant'
import { useSpeechRecognition } from './useSpeechRecognition'

// Un affichage de l'accueil par conversation et par page : changer de vue remonte le
// panneau sans compter un nouvel affichage.
const propositionsShown = new Set<string>()

export function AssistantPanel({
  conversationId,
  pageContext,
  pendingQuestion,
  onPendingQuestionSent,
  onBack,
  renderActions,
}: {
  conversationId: string
  pageContext: PageContext | undefined
  /** Question saisie dans la palette : envoyée une fois, après la réponse en cours. */
  pendingQuestion?: PendingQuestion | null
  onPendingQuestionSent?: (id: string) => void
  /** ⇧Tab : retour à l'écran d'où l'on vient. */
  onBack?: () => void
  renderActions?: (message: ReturnType<typeof useAssistant>['messages'][number]) => ReactNode
}) {
  const { messages, sendMessage, status, error, regenerate, stop } = useAssistant({
    conversationId,
    pageContext,
  })
  const [input, setInputState] = useState(() => readDraft(conversationId))
  const setInput = (text: string) => {
    setInputState(text)
    writeDraft(conversationId, text)
  }
  const thread = useRef<HTMLDivElement>(null)
  const field = useRef<HTMLTextAreaElement>(null)
  const lastSentId = useRef<string | null>(null)
  const speech = useSpeechRecognition({
    onTranscript: (text) => setInput(appendTranscript(input, text)),
  })
  const { cancel: cancelSpeech } = speech
  // Lus à l'envoi sans rendre `send` instable à chaque morceau de réponse.
  const messagesRef = useRef(messages)
  useEffect(() => {
    messagesRef.current = messages
  }, [messages])
  // Quelle que soit la façon d'envoyer, la dictée s'arrête : elle remplirait sinon le champ
  // pendant la réponse.
  const send = useCallback(
    (text: string, origin: QuestionSendContext['origine']) => {
      cancelSpeech()
      analytics.trackEvent(
        analyticsEvents.assistant.questionSend({
          conversation_id: conversationId,
          origine: origin,
          type_question: questionType({
            messages: messagesRef.current,
            fromProposition: origin === 'proposition',
          }),
        }),
      )
      void sendMessage({ text })
    },
    [cancelSpeech, conversationId, sendMessage],
  )
  // Stables : un message déjà affiché ne se re-rend pas à chaque frappe ni à chaque morceau.
  const choose = useCallback(
    (label: string) => {
      analytics.trackEvent(
        analyticsEvents.assistant.responseChoice({ conversation_id: conversationId }),
      )
      send(label, 'choix')
    },
    [conversationId, send],
  )
  const writeOther = useCallback(() => {
    analytics.trackEvent(
      analyticsEvents.assistant.responseChoiceOther({ conversation_id: conversationId }),
    )
    field.current?.focus()
  }, [conversationId])
  // Le fil suit la réponse, sauf si l'on remonte pour relire ; une nouvelle question
  // le raccroche.
  const following = useRef(true)
  const [detached, setDetached] = useState(false)
  const messageCount = useRef(messages.length)
  const queryClient = useQueryClient()

  // L'accès a pu être retiré entre-temps : relu, il fait disparaître l'assistant plutôt que
  // de laisser réessayer en vain.
  useEffect(() => {
    if (error) void queryClient.invalidateQueries(assistantAccessQueryOptions())
  }, [error, queryClient])

  useEffect(() => {
    const question = questionToSend({
      pending: pendingQuestion ?? null,
      lastSentId: lastSentId.current,
      status,
    })
    if (!question) return
    lastSentId.current = question.id
    send(question.text, 'palette')
    onPendingQuestionSent?.(question.id)
  }, [pendingQuestion, onPendingQuestionSent, send, status])

  useEffect(() => {
    // L'accueil se lit depuis son début.
    if (messages.length === 0) return
    if (messages.length !== messageCount.current) {
      messageCount.current = messages.length
      following.current = true
    }
    const element = thread.current
    if (element && following.current) element.scrollTop = element.scrollHeight
  }, [messages, status])

  const onThreadScroll = () => {
    const element = thread.current
    if (!element) return
    following.current = isNearBottom(element)
    setDetached(!following.current)
  }

  const followResponse = () => {
    const element = thread.current
    if (!element) return
    analytics.trackEvent(
      analyticsEvents.assistant.answerFollow({ conversation_id: conversationId }),
    )
    following.current = true
    element.scrollTop = element.scrollHeight
  }

  const busy = status === 'submitted' || status === 'streaming'
  const last = messages.at(-1)
  const waiting = status === 'submitted' && last?.role === 'user'

  const submit = () => {
    const text = input.trim()
    if (text.length === 0 || busy) return
    send(text, questionOrigin({ text, prefill: prefillOf(conversationId) }))
    setPrefill(conversationId, null)
    setInput('')
  }

  const chooseProposition = (proposition: Proposition) => {
    analytics.trackEvent(
      analyticsEvents.assistant.propositionClick({
        proposition_id: proposition.id,
        proposition_mode: proposition.mode === 'send' ? 'envoi_direct' : 'preremplissage',
      }),
    )
    if (proposition.mode === 'send') {
      send(proposition.message, 'proposition')
      return
    }
    setPrefill(conversationId, proposition.message)
    setInput(proposition.message)
    field.current?.focus()
  }

  const empty = messages.length === 0 && !pendingQuestion && !busy
  const propositions = propositionsFor(pageContext)

  useEffect(() => {
    const key = propositionViewKey({ conversationId, pageContext })
    if (!empty || propositionsShown.has(key)) return
    propositionsShown.add(key)
    analytics.trackEvent(
      analyticsEvents.assistant.propositionView({
        nombre_choix: propositions.length,
        page_type: pageType(pageContext),
      }),
    )
  }, [conversationId, empty, pageContext, propositions.length])

  return (
    <div
      className="flex h-full flex-col gap-4"
      onKeyDown={(event) => {
        // Depuis le champ seulement : ailleurs, Maj+Tab garde la navigation arrière.
        if (onBack && event.key === 'Tab' && event.shiftKey && event.target === field.current) {
          event.preventDefault()
          onBack()
        }
      }}
    >
      <div className="relative flex min-h-0 flex-1 flex-col">
        <div
          ref={thread}
          onScroll={onThreadScroll}
          className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto pr-1"
        >
          {empty && <EmptyState propositions={propositions} onChoose={chooseProposition} />}
          {messages.map((message) =>
            message.role === 'user' ? (
              <UserMessage key={message.id} message={message} />
            ) : (
              <AssistantMessage
                key={message.id}
                message={message}
                state={message === last ? deriveAssistantState({ message, status }) : null}
                showChoices={message === last && status === 'ready'}
                onChoose={choose}
                onWriteOther={writeOther}
                conversationId={conversationId}
                actions={message === last && status === 'ready' ? renderActions?.(message) : null}
              />
            ),
          )}
          {waiting && <AssistantSignature state="thinking" />}
          {error && (
            <div className="flex items-center gap-3 border-l-4 border-error bg-error-tinted p-3 text-sm text-text">
              <span>La réponse n&apos;a pas pu aboutir.</span>
              <Button
                variant="tertiary"
                size="sm"
                onClick={() => {
                  analytics.trackEvent(
                    analyticsEvents.assistant.answerRetry({ conversation_id: conversationId }),
                  )
                  void regenerate()
                }}
              >
                Réessayer
              </Button>
            </div>
          )}
        </div>
        {detached && busy && (
          <button
            type="button"
            onClick={followResponse}
            className="absolute bottom-2 left-1/2 inline-flex h-8 -translate-x-1/2 items-center gap-1.5 bg-text px-3 text-xs font-medium text-surface shadow-md hover:bg-text-muted"
          >
            <ArrowDown className="size-3.5" />
            Suivre la réponse
          </button>
        )}
      </div>

      <form
        className="flex items-end gap-2"
        onSubmit={(event) => {
          event.preventDefault()
          submit()
        }}
      >
        <div className="flex-1">
          <FieldTextarea
            ref={field}
            label="Votre question"
            hideLabel
            autoFocus
            rows={2}
            value={input}
            placeholder={busy ? "L'assistant prépare sa réponse…" : 'Posez votre question…'}
            onChange={(event) => {
              if (event.target.value.trim() === '') setPrefill(conversationId, null)
              setInput(event.target.value)
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault()
                submit()
              }
            }}
          />
        </div>
        {speech.isSupported && (
          <IconButton
            label={speech.state === 'listening' ? "Arrêter l'écoute" : 'Dicter un message'}
            aria-pressed={speech.state === 'listening'}
            disabled={busy}
            onClick={() => {
              if (speech.state === 'inactive') {
                analytics.trackEvent(analyticsEvents.assistant.speechStart())
              }
              speech.toggle()
            }}
            className={clsxm(
              speech.state === 'listening' &&
                'animate-pulse bg-error text-surface hover:bg-error hover:text-surface motion-reduce:animate-none',
            )}
          >
            <Mic />
          </IconButton>
        )}
        {busy ? (
          <Button
            type="button"
            onClick={() => {
              analytics.trackEvent(
                analyticsEvents.assistant.answerStop({ conversation_id: conversationId }),
              )
              void stop()
            }}
          >
            <Square className="size-3.5" />
            Arrêter
          </Button>
        ) : (
          <Button type="submit" disabled={input.trim().length === 0}>
            Envoyer
          </Button>
        )}
      </form>
    </div>
  )
}
