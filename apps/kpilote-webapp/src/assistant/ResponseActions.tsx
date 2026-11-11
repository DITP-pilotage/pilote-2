import {
  CATEGORY_LABELS,
  ISSUE_CATEGORIES,
  type IssueCategory,
  type RateBody,
} from '@pilote/kpilote-shared/assistant/feedback'
import type { KpiloteUIMessage } from '@pilote/kpilote-shared/assistant/message'
import { Button } from '@pilote/kpilote-ui/Button'
import { FieldTextarea } from '@pilote/kpilote-ui/FieldTextarea'
import { Modale } from '@pilote/kpilote-ui/Modale'
import { MultiToggle } from '@pilote/kpilote-ui/MultiToggle'
import { useToast } from '@pilote/kpilote-ui/Toast'
import { Copy, ThumbsDown, ThumbsUp } from 'lucide-react'
import { useId, useState } from 'react'

import { rateCall } from './assistantApi'
import { copyableText } from './copyResponse'

const CATEGORY_OPTIONS = ISSUE_CATEGORIES.map((category) => ({
  value: category,
  label: (
    <span className="flex flex-col text-left">
      <span className="font-medium">{CATEGORY_LABELS[category].title}</span>
      <span className="text-[11px] opacity-80">{CATEGORY_LABELS[category].hint}</span>
    </span>
  ),
}))

function NegativeFeedbackModal({
  open,
  onClose,
  onSubmit,
  sending,
}: {
  open: boolean
  onClose: () => void
  onSubmit: (body: RateBody) => void
  sending: boolean
}) {
  const [categories, setCategories] = useState<IssueCategory[]>([])
  const [commentaire, setCommentaire] = useState('')
  const categoriesLabelId = useId()
  // « Autre » sans texte n'apprend rien : l'envoi est bloqué plutôt que de collecter du bruit.
  const blocked =
    categories.length === 0 || (categories.includes('AUTRE') && commentaire.trim().length === 0)

  return (
    <Modale
      open={open}
      onClose={onClose}
      titre="Qu'est-ce qui n'allait pas ?"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="tertiary" size="sm" onClick={onClose}>
            Annuler
          </Button>
          <Button
            size="sm"
            disabled={blocked || sending}
            onClick={() =>
              onSubmit({
                evaluation: 'NEGATIVE',
                categories,
                ...(commentaire.trim() ? { commentaire: commentaire.trim() } : {}),
              })
            }
          >
            Envoyer
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <p id={categoriesLabelId} className="m-0 text-sm font-medium">
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
        <FieldTextarea
          label={categories.includes('AUTRE') ? 'Décrivez le problème' : 'Précisez (optionnel)'}
          value={commentaire}
          onChange={(event) => setCommentaire(event.target.value)}
          rows={3}
        />
      </div>
    </Modale>
  )
}

/** Copie et évaluation de la dernière réponse, comme sur PPG. */
export function ResponseActions({ message }: { message: KpiloteUIMessage }) {
  const toast = useToast()
  const [rated, setRated] = useState(false)
  const [sending, setSending] = useState(false)
  const [negativeOpen, setNegativeOpen] = useState(false)
  const llmCallId = message.metadata?.llmCallId

  const copy = () => {
    navigator.clipboard
      .writeText(copyableText(message))
      .then(() => toast({ title: 'Texte copié dans le presse-papiers' }))
      .catch(() => toast({ title: "Le texte n'a pas pu être copié", variant: 'error' }))
  }

  const rate = (body: RateBody) => {
    if (!llmCallId) return
    setSending(true)
    rateCall({ llmCallId, body })
      .then(() => {
        setRated(true)
        setNegativeOpen(false)
        toast({ title: 'Merci pour votre retour' })
      })
      .catch(() => toast({ title: "Votre retour n'a pas pu être envoyé", variant: 'error' }))
      .finally(() => setSending(false))
  }

  return (
    <div className="flex flex-wrap items-center gap-1">
      <Button variant="tertiary" size="sm" onClick={copy}>
        <Copy className="size-3.5" />
        Copier le texte
      </Button>
      {llmCallId && !rated && (
        <>
          <Button
            variant="tertiary"
            size="sm"
            aria-label="Réponse utile"
            disabled={sending}
            onClick={() => rate({ evaluation: 'POSITIVE' })}
          >
            <ThumbsUp className="size-3.5" />
          </Button>
          <Button
            variant="tertiary"
            size="sm"
            aria-label="Réponse à améliorer"
            disabled={sending}
            onClick={() => setNegativeOpen(true)}
          >
            <ThumbsDown className="size-3.5" />
          </Button>
          <NegativeFeedbackModal
            open={negativeOpen}
            onClose={() => setNegativeOpen(false)}
            onSubmit={rate}
            sending={sending}
          />
        </>
      )}
    </div>
  )
}
