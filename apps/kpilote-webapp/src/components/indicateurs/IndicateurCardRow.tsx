import { type ReactNode } from 'react'

// Ligne de relevé d'une carte : libellé à gauche, valeur alignée à droite. Les
// valeurs de cartes voisines s'alignent ainsi d'une colonne à l'autre.
export function IndicateurCardRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex min-h-6 flex-wrap items-center justify-between gap-x-4 gap-y-1 text-sm">
      <span className="text-text-muted">{label}</span>
      <span className="ml-auto flex flex-wrap items-center justify-end gap-x-2 text-right">
        {children}
      </span>
    </div>
  )
}
