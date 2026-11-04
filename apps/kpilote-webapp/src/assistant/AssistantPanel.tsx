import type { PageContext } from '@pilote/kpilote-shared/assistant/chat'
import { Button } from '@pilote/kpilote-ui/Button'
import { FieldTextarea } from '@pilote/kpilote-ui/FieldTextarea'
import { Square } from 'lucide-react'
import { useEffect, useRef, useState, type ReactNode } from 'react'

import { AssistantMessage, UserMessage } from './AssistantMessage'
import { AssistantSignature } from './AssistantSignature'
import { deriveAssistantState } from './deriveAssistantState'
import { useAssistant } from './useAssistant'

export function AssistantPanel({
  conversationId,
  pageContext,
  initialQuestion,
  onInitialQuestionSent,
  onBack,
  renderActions,
}: {
  conversationId: string
  pageContext: PageContext | undefined
  /** Question saisie dans la palette : envoyée à l'ouverture, une seule fois. */
  initialQuestion?: string
  onInitialQuestionSent?: () => void
  /** ⇧Tab : retour à l'écran d'où l'on vient. */
  onBack?: () => void
  renderActions?: (message: ReturnType<typeof useAssistant>['messages'][number]) => ReactNode
}) {
  const { messages, sendMessage, status, error, regenerate, stop } = useAssistant({
    conversationId,
    pageContext,
  })
  const [input, setInput] = useState('')
  const thread = useRef<HTMLDivElement>(null)
  const field = useRef<HTMLTextAreaElement>(null)
  const sentInitial = useRef(false)

  useEffect(() => {
    const question = initialQuestion?.trim()
    if (sentInitial.current || !question) return
    sentInitial.current = true
    void sendMessage({ text: question })
    onInitialQuestionSent?.()
  }, [initialQuestion, onInitialQuestionSent, sendMessage])

  useEffect(() => {
    const element = thread.current
    if (element) element.scrollTop = element.scrollHeight
  }, [messages, status])

  const busy = status === 'submitted' || status === 'streaming'
  const last = messages.at(-1)
  const waiting = status === 'submitted' && last?.role === 'user'

  const submit = () => {
    const text = input.trim()
    if (text.length === 0 || busy) return
    void sendMessage({ text })
    setInput('')
  }

  return (
    <div
      className="flex h-full flex-col gap-4"
      onKeyDown={(event) => {
        if (onBack && event.key === 'Tab' && event.shiftKey) {
          event.preventDefault()
          onBack()
        }
      }}
    >
      <div ref={thread} className="flex flex-1 flex-col gap-6 overflow-y-auto pr-1">
        {messages.map((message) =>
          message.role === 'user' ? (
            <UserMessage key={message.id} message={message} />
          ) : (
            <AssistantMessage
              key={message.id}
              message={message}
              state={message === last ? deriveAssistantState({ message, status }) : null}
              showChoices={message === last && status === 'ready'}
              onChoose={(label) => void sendMessage({ text: label })}
              onWriteOther={() => field.current?.focus()}
              actions={message === last && status === 'ready' ? renderActions?.(message) : null}
            />
          ),
        )}
        {waiting && <AssistantSignature state="thinking" />}
        {error && (
          <div className="flex items-center gap-3 border-l-4 border-error bg-error-tinted p-3 text-sm text-text">
            <span>La réponse n&apos;a pas pu aboutir.</span>
            <Button variant="tertiary" size="sm" onClick={() => void regenerate()}>
              Réessayer
            </Button>
          </div>
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
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault()
                submit()
              }
            }}
          />
        </div>
        {busy ? (
          <Button type="button" onClick={() => void stop()}>
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
