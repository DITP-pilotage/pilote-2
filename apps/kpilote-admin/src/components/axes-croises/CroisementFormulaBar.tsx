import { CroisementExplanation } from '@/components/axes-croises/CroisementExplanation'
import { type AxeCroise, type CelluleCroisee, type CelluleIds } from '@/lib/axesCroises'

export function CroisementFormulaBar({
  axes,
  reference,
  cellule,
  resolve,
}: {
  axes: ReadonlyArray<AxeCroise>
  reference: string
  cellule: CelluleCroisee | null
  resolve: (ids: CelluleIds) => CelluleCroisee
}) {
  return (
    <div className="flex min-h-12 items-stretch border-b border-border bg-surface text-sm">
      <div className="flex w-72 shrink-0 items-center border-r border-border px-3 text-xs font-medium text-text-muted">
        {reference}
      </div>
      <div className="flex shrink-0 items-center border-r border-border px-3 font-serif text-text-subtle italic">
        fx
      </div>
      <div className="flex min-w-0 flex-1 items-center px-3 py-2 text-text">
        <CroisementExplanation axes={axes} cellule={cellule} resolve={resolve} />
      </div>
    </div>
  )
}
