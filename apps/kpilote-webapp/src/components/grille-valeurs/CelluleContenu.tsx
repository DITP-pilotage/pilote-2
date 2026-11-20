import { Sparkles, TriangleAlert } from 'lucide-react'

import { clsxm } from '@/lib/clsxm'
import { type CelluleGrille } from '@/lib/grilleValeurs'

export function CelluleContenu({ cellule }: { cellule: CelluleGrille }) {
  return (
    <>
      {cellule.isAlbert ? (
        <Sparkles
          aria-label="Rapproché par l’assistant IA"
          className="size-3.5 shrink-0 text-blue-cumulus"
        />
      ) : null}
      {cellule.isWarning ? (
        <TriangleAlert aria-label="À corriger" className="size-3.5 shrink-0 text-warning" />
      ) : null}
      <span
        className={clsxm(
          'truncate',
          cellule.isWarning ? 'font-medium text-warning' : 'text-text',
          cellule.isCalculee && 'text-text-muted',
          cellule.alignRight && 'tabular-nums',
        )}
      >
        {cellule.text}
      </span>
      {cellule.identifiant === null ? null : (
        <span className="ml-auto whitespace-nowrap pl-2 font-mono text-[11px] text-text-muted">
          {cellule.identifiant}
        </span>
      )}
    </>
  )
}
