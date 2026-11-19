import { CollapseButton } from '@/components/axe-graphe/CollapseButton'
import { ComputedValue } from '@/components/axe-graphe/ComputedValue'
import { KindMarker } from '@/components/axe-graphe/KindMarker'
import { KIND_ROW_CLASS, STATUT_CLASS, TONE_CLASS } from '@/components/axe-graphe/tableurClasses'
import { type ArbreNode } from '@/lib/axeArbre'
import { type Cellule, PERIODES } from '@/lib/axeSerie'
import { placeholderOf, type TableurTone } from '@/lib/axeTableur'
import { clsxm } from '@/lib/clsxm'

const ROW_INDENT = 16

export function TableurRow({
  node,
  rank,
  niveauNom,
  isCollapsed,
  canToggle,
  isSelected,
  saisies,
  cellules,
  toneOf,
  onToggle,
  onSelect,
  onActivate,
  onSaisie,
}: {
  node: ArbreNode
  rank: number
  niveauNom: string
  isCollapsed: boolean
  canToggle: boolean
  isSelected: boolean
  saisies: ReadonlyArray<string> | undefined
  cellules: ReadonlyArray<Cellule>
  toneOf: (index: number) => TableurTone | undefined
  onToggle: () => void
  onSelect: () => void
  onActivate: (index: number) => void
  onSaisie: (input: { index: number; value: string }) => void
}) {
  const rowClass = KIND_ROW_CLASS[node.kind]
  return (
    <tr className="group">
      <td className="sticky left-0 z-10 w-10 border-r border-b border-border bg-surface-muted text-center text-[11px] text-text-subtle tabular-nums">
        {rank}
      </td>
      <td
        className={clsxm(
          'sticky left-10 z-10 border-r border-b border-border px-2 py-1',
          rowClass,
          isSelected && 'bg-primary-tinted',
        )}
      >
        <div className="flex items-center gap-1" style={{ paddingLeft: node.niveau * ROW_INDENT }}>
          {canToggle ? (
            <CollapseButton nom={node.nom} isCollapsed={isCollapsed} onToggle={onToggle} />
          ) : (
            <span className="size-5" />
          )}
          <button
            type="button"
            onClick={onSelect}
            className="flex min-w-0 items-center gap-2 text-left hover:text-primary"
          >
            <KindMarker kind={node.kind} />
            <span className={clsxm('truncate', node.kind === 'tous' && 'font-semibold')}>
              {node.nom}
            </span>
            {isCollapsed ? (
              <span className="shrink-0 text-[11px] font-normal text-text-subtle">
                ({node.children.length} enfants repliés)
              </span>
            ) : null}
          </button>
        </div>
      </td>
      <td
        className={clsxm(
          'border-r border-b border-border px-3 py-1 text-xs font-normal whitespace-nowrap text-text-muted',
          rowClass,
        )}
      >
        {niveauNom}
      </td>
      {PERIODES.map((periode, index) => {
        const cellule = cellules[index]
        const tone = toneOf(index)
        return (
          <td
            key={periode}
            className={clsxm(
              'h-8 min-w-28 border-r border-b border-border p-0 text-right tabular-nums',
              rowClass,
              cellule && STATUT_CLASS[cellule.statut],
              tone && TONE_CLASS[tone],
            )}
          >
            {node.kind === 'feuille' ? (
              <input
                value={saisies?.[index] ?? ''}
                onFocus={() => onActivate(index)}
                onChange={(event) => onSaisie({ index, value: event.target.value })}
                placeholder={placeholderOf(cellule)}
                inputMode="decimal"
                aria-label={`${node.nom}, ${periode}`}
                className="h-full w-full bg-transparent px-3 text-right tabular-nums not-italic outline-none placeholder:text-inherit"
              />
            ) : (
              <button
                type="button"
                onClick={() => onActivate(index)}
                className="flex h-full w-full items-center justify-end gap-1 px-3"
              >
                <ComputedValue cellule={cellule} />
              </button>
            )}
          </td>
        )
      })}
    </tr>
  )
}
