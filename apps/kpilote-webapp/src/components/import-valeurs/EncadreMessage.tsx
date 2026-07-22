import { type ReactNode } from 'react'

// Encadré de statut sous la zone d'import : neutre (info/chargement) ou erreur.
export function EncadreMessage({
  variant = 'neutre',
  children,
}: {
  variant?: 'neutre' | 'erreur'
  children: ReactNode
}) {
  const classes =
    variant === 'erreur'
      ? 'border-red-marianne/30 bg-red-marianne/5 text-red-marianne'
      : 'border-border bg-background/60 text-text-muted'

  return <p className={`mt-3 rounded-lg border px-4 py-3 text-sm ${classes}`}>{children}</p>
}
