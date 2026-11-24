import { type ReactNode } from 'react'

import { clsxm } from '@/lib/clsxm'

// Encadré de statut de la modale d'import : neutre (information, chargement) ou erreur.
export function ImportMessage({
  variant = 'neutre',
  children,
}: {
  variant?: 'neutre' | 'erreur'
  children: ReactNode
}) {
  return (
    <p
      className={clsxm(
        'mt-3 rounded-lg border px-4 py-3 text-sm',
        variant === 'erreur'
          ? 'border-red-marianne/30 bg-red-marianne/5 text-red-marianne'
          : 'border-border bg-background/60 text-text-muted',
      )}
    >
      {children}
    </p>
  )
}
