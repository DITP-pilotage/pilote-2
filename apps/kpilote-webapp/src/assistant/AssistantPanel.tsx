import { Button } from '@pilote/kpilote-ui/Button'
import { useState } from 'react'

import { AssistantMessage } from './AssistantMessage'
import { BarreFeedback } from './BarreFeedback'
import { useAssistant } from './useAssistant'

export function AssistantPanel({
  conversationId,
  questionInitiale,
}: {
  conversationId: string
  questionInitiale?: string
}) {
  const { messages, sendMessage, status, error } = useAssistant(conversationId)
  const [saisie, setSaisie] = useState(questionInitiale ?? '')

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="flex-1 space-y-4 overflow-y-auto">
        {messages.map((message) => (
          <AssistantMessage key={message.id} message={message} />
        ))}
        {status === 'submitted' && <p className="text-sm text-text-subtle">Réflexion en cours…</p>}
        {error && <p className="text-sm text-text-muted">Erreur : {error.message}</p>}
      </div>

      {messages.length > 0 && status === 'ready' && (
        <BarreFeedback conversationId={conversationId} />
      )}

      <form
        className="flex gap-2"
        onSubmit={(evenement) => {
          evenement.preventDefault()
          if (saisie.trim().length === 0) return
          void sendMessage({ text: saisie.trim() })
          setSaisie('')
        }}
      >
        <input
          value={saisie}
          onChange={(evenement) => setSaisie(evenement.target.value)}
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
