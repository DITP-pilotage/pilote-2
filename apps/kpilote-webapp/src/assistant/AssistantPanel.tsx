import { Button } from '@pilote/kpilote-ui/Button'
import { useState } from 'react'

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

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="flex-1 space-y-4 overflow-y-auto">
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
        <input
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Posez votre question…"
          className="flex-1 rounded border border-border px-3 py-2"
        />
        <Button type="submit" disabled={status !== 'ready'}>
          Envoyer
        </Button>
      </form>
    </div>
  )
}
