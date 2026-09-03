import {
  CATEGORY_LABELS,
  ISSUE_CATEGORIES,
  type IssueCategory,
} from '@pilote/kpilote-shared/assistant/feedback'
import { Button } from '@pilote/kpilote-ui/Button'
import { FieldTextarea } from '@pilote/kpilote-ui/FieldTextarea'
import { MultiToggle } from '@pilote/kpilote-ui/MultiToggle'
import { Subtitle } from '@pilote/kpilote-ui/Subtitle'
import { useId, useState } from 'react'

import { apiClient } from '@/api/client'

const Status = {
  Idle: 'idle',
  Positive: 'positive',
  Negative: 'negative',
  Sent: 'sent',
} as const

type Status = (typeof Status)[keyof typeof Status]

// Chaque catégorie porte son intitulé et l'exemple qui la désambiguïse : « Suggestion »
// seul ne dit pas s'il s'agit du produit ou de la réponse.
const CATEGORY_OPTIONS = ISSUE_CATEGORIES.map((category) => ({
  value: category,
  label: (
    <span className="flex flex-col text-left">
      <span className="font-medium">{CATEGORY_LABELS[category].title}</span>
      <span className="text-[11px] opacity-80">{CATEGORY_LABELS[category].hint}</span>
    </span>
  ),
}))

export function FeedbackBar({ conversationId }: { conversationId: string }) {
  const [status, setStatus] = useState<Status>(Status.Idle)
  const [categories, setCategories] = useState<IssueCategory[]>([])
  const [comment, setComment] = useState('')
  const categoriesLabelId = useId()

  const send = async (body: Record<string, unknown>) => {
    await apiClient.post(`assistant/conversations/${conversationId}/evaluation`, { json: body })
    setStatus(Status.Sent)
  }

  // « Autre » sans texte n'apprend rien : on bloque l'envoi plutôt que de collecter du bruit.
  const negativeSubmitBlocked =
    categories.length === 0 || (categories.includes('AUTRE') && comment.trim().length === 0)

  if (status === Status.Sent) return <Subtitle>Merci pour votre retour.</Subtitle>

  if (status === Status.Idle) {
    return (
      <div className="flex items-center gap-2">
        <Subtitle>Cette réponse vous a-t-elle aidé ?</Subtitle>
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
        <div className="flex flex-col gap-2">
          <p id={categoriesLabelId} className="text-sm font-medium">
            Quel type de problème avez-vous rencontré ?
          </p>
          <MultiToggle
            value={categories}
            onValueChange={setCategories}
            options={CATEGORY_OPTIONS}
            ariaLabelledBy={categoriesLabelId}
            className="flex-wrap"
          />
        </div>
      )}

      <FieldTextarea
        label={
          status === Status.Positive
            ? "Qu'avez-vous apprécié ? (optionnel)"
            : 'Décrivez le problème'
        }
        value={comment}
        onChange={(event) => setComment(event.target.value)}
        rows={3}
      />

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
