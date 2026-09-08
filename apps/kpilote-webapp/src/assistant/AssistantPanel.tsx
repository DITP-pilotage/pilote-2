import { Button } from '@pilote/kpilote-ui/Button'
import { FieldInput } from '@pilote/kpilote-ui/FieldInput'
import { useEffect, useRef, useState } from 'react'

import { AssistantMessage } from './AssistantMessage'
import { FeedbackBar } from './FeedbackBar'
import { useAssistant } from './useAssistant'

export function AssistantPanel({
  conversationId,
  initialQuestion,
}: {
  conversationId: string
  initialQuestion?: string
}) {
  const { messages, sendMessage, status, error } = useAssistant(conversationId)
  const [input, setInput] = useState(initialQuestion ?? '')
  const thread = useRef<HTMLDivElement>(null)

  // Le fil suit la réponse : à chaque lot de tokens, on colle le bas du flux au bas de la
  // zone. `messages` change à chaque throttle du flux, donc ça tient le rythme du streaming.
  useEffect(() => {
    const element = thread.current
    if (element) element.scrollTop = element.scrollHeight
  }, [messages, status])

  return (
    <div className="flex h-full flex-col gap-4">
      <div ref={thread} className="flex-1 space-y-4 overflow-y-auto">
        {messages.map((message) => (
          <AssistantMessage key={message.id} message={message} />
        ))}
        {status === 'submitted' && <p className="text-sm text-text-subtle">Réflexion en cours…</p>}
        {error && <p className="text-sm text-text-muted">Erreur : {error.message}</p>}
      </div>

      {messages.length > 0 && status === 'ready' && <FeedbackBar conversationId={conversationId} />}

      <form
        className="flex gap-2"
        onSubmit={(event) => {
          event.preventDefault()
          if (input.trim().length === 0) return
          void sendMessage({ text: input.trim() })
          setInput('')
        }}
      >
        {/* Le libellé reste dans le DOM pour les lecteurs d'écran ; le placeholder
            suffit à l'œil dans un fil de conversation. */}
        <div className="flex-1">
          <FieldInput
            label="Votre question"
            hideLabel
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Posez votre question…"
          />
        </div>
        <Button type="submit" disabled={status !== 'ready'}>
          Envoyer
        </Button>
      </form>
    </div>
  )
}
