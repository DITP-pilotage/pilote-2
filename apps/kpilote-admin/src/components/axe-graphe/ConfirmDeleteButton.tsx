import { Trash2 } from 'lucide-react'
import { useState } from 'react'

import { Button } from '@pilote/kpilote-ui/Button'

export function ConfirmDeleteButton({
  label = 'Supprimer',
  blockedReason,
  disabled,
  onConfirm,
}: {
  label?: string
  // Pourquoi la suppression est impossible (des enfants, des modalités) ; undefined sinon.
  blockedReason?: string | undefined
  disabled: boolean
  onConfirm: () => void
}) {
  const [isConfirming, setIsConfirming] = useState(false)
  if (isConfirming) {
    return (
      <span className="inline-flex items-center gap-2">
        <Button
          size="sm"
          disabled={disabled}
          onClick={onConfirm}
          className="bg-error hover:bg-error/90"
        >
          Confirmer
        </Button>
        <Button size="sm" variant="tertiary" onClick={() => setIsConfirming(false)}>
          Annuler
        </Button>
      </span>
    )
  }
  return (
    <Button
      size="sm"
      variant="tertiary"
      disabled={blockedReason !== undefined || disabled}
      title={blockedReason}
      onClick={() => setIsConfirming(true)}
      className="self-start text-error hover:bg-error-tinted"
    >
      <Trash2 /> {label}
    </Button>
  )
}
