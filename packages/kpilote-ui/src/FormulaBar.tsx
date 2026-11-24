import { type ReactNode } from 'react'

// Barre de formule d'un tableau : la référence de la cellule choisie, puis d'où vient sa valeur.
export function FormulaBar({ reference, children }: { reference: ReactNode; children: ReactNode }) {
  return (
    <div className="flex min-h-12 items-stretch border-b border-border bg-surface text-sm">
      <div className="flex w-72 shrink-0 items-center border-r border-border px-3 text-xs font-medium text-text-muted">
        {reference}
      </div>
      <div className="flex shrink-0 items-center border-r border-border px-3 font-serif text-text-subtle italic">
        fx
      </div>
      <div className="flex min-w-0 flex-1 items-center px-3 py-2 text-text">{children}</div>
    </div>
  )
}
