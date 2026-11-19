import { type TermeAffiche } from '@/lib/axes/explicationCellule'
import { clsxm } from '@/lib/clsxm'
import { formatNumberFr, formatPercentFr } from '@/lib/format'

export function TermeChip({ terme }: { terme: TermeAffiche }) {
  const isManquant = terme.valeur === null
  return (
    <li
      className={clsxm(
        'flex items-baseline gap-1.5 rounded-md border px-2 py-1 text-xs',
        isManquant
          ? 'border-warning-425/40 bg-warning-tinted text-warning'
          : 'border-border bg-surface',
      )}
    >
      <span className={clsxm(!isManquant && 'text-text-muted')}>{terme.nom}</span>
      {terme.valeur === null ? (
        <span>sans valeur</span>
      ) : (
        <strong className="tabular-nums">{formatNumberFr(terme.valeur)}</strong>
      )}
      {terme.part === null ? null : (
        <span className="text-[10px] text-text-subtle tabular-nums">
          {formatPercentFr(terme.part)}
        </span>
      )}
    </li>
  )
}
