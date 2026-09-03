import {
  CATEGORY_LABELS,
  ISSUE_CATEGORIES,
  type IssueCategory,
} from '@pilote/kpilote-shared/assistant/feedback'
import { Button } from '@pilote/kpilote-ui/Button'
import { useState } from 'react'

import { apiClient } from '@/api/client'
import { clsxm } from '@/lib/clsxm'

const Status = {
  Idle: 'idle',
  Positive: 'positive',
  Negative: 'negative',
  Sent: 'sent',
} as const

type Status = (typeof Status)[keyof typeof Status]

export function FeedbackBar({ conversationId }: { conversationId: string }) {
  const [status, setStatus] = useState<Status>(Status.Idle)
  const [categories, setCategories] = useState<IssueCategory[]>([])
  const [comment, setComment] = useState('')

  const send = async (body: Record<string, unknown>) => {
    await apiClient.post(`assistant/conversations/${conversationId}/evaluation`, { json: body })
    setStatus(Status.Sent)
  }

  // « Autre » sans texte n'apprend rien : on bloque l'envoi plutôt que de collecter du bruit.
  const negativeSubmitBlocked =
    categories.length === 0 || (categories.includes('AUTRE') && comment.trim().length === 0)

  if (status === Status.Sent) {
    return <p className="text-sm text-text-subtle">Merci pour votre retour.</p>
  }

  if (status === Status.Idle) {
    return (
      <div className="flex items-center gap-2 text-sm">
        <span className="text-text-subtle">Cette réponse vous a-t-elle aidé ?</span>
        <Button variant="tertiary" size="sm" onClick={() => setStatus(Status.Positive)}>
          Oui
        </Button>
        <Button variant="tertiary" size="sm" onClick={() => setStatus(Status.Negative)}>
          Non
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3 rounded border border-border p-3">
      {status === Status.Negative && (
        <fieldset className="flex flex-col gap-2">
          <legend className="text-sm font-medium">
            Quel type de problème avez-vous rencontré ?
          </legend>
          <div className="flex flex-wrap gap-2">
            {ISSUE_CATEGORIES.map((category) => {
              const checked = categories.includes(category)
              return (
                <button
                  key={category}
                  type="button"
                  aria-pressed={checked}
                  onClick={() =>
                    setCategories((previous) =>
                      checked
                        ? previous.filter((value) => value !== category)
                        : [...previous, category],
                    )
                  }
                  className={clsxm(
                    'rounded border px-2 py-1 text-left text-sm',
                    checked ? 'border-border-strong bg-surface' : 'border-border',
                  )}
                >
                  <span className="block font-medium">{CATEGORY_LABELS[category].title}</span>
                  <span className="block text-xs text-text-subtle">
                    {CATEGORY_LABELS[category].hint}
                  </span>
                </button>
              )
            })}
          </div>
        </fieldset>
      )}

      <label className="flex flex-col gap-1 text-sm">
        {status === Status.Positive
          ? "Qu'avez-vous apprécié ? (optionnel)"
          : 'Décrivez le problème'}
        <textarea
          value={comment}
          onChange={(event) => setComment(event.target.value)}
          className="rounded border border-border p-2"
          rows={3}
        />
      </label>

      <div className="flex justify-end gap-2">
        <Button variant="tertiary" size="sm" onClick={() => setStatus(Status.Idle)}>
          Annuler
        </Button>
        <Button
          size="sm"
          disabled={status === Status.Negative && negativeSubmitBlocked}
          onClick={() =>
            void send(
              status === Status.Positive
                ? { evaluation: 'POSITIVE', commentaire: comment || undefined }
                : { evaluation: 'NEGATIVE', categories, commentaire: comment || undefined },
            )
          }
        >
          Envoyer
        </Button>
      </div>
    </div>
  )
}
