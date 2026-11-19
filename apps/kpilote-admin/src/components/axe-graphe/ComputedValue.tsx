import { formatValue } from '@/lib/axeArbre'
import { type Cellule } from '@/lib/axeSerie'
import { clsxm } from '@/lib/clsxm'

export function ComputedValue({ cellule }: { cellule: Cellule | undefined }) {
  if (!cellule || cellule.statut === 'absente') return <span className="font-normal">·</span>
  const isIncomplete = cellule.present < cellule.expected
  return (
    <>
      {isIncomplete ? (
        <span className="text-[10px] font-normal text-warning-425">
          {cellule.present}/{cellule.expected}
        </span>
      ) : null}
      <span className={clsxm(cellule.value === null && 'font-normal text-warning')}>
        {cellule.value === null ? '?' : formatValue(cellule.value)}
      </span>
    </>
  )
}
