import { CroisementCell } from '@/components/axes-croises/CroisementCell'
import { EMPHASIS_CLASS } from '@/components/axes-croises/emphasisClass'
import { NodeHeader } from '@/components/axes-croises/NodeHeader'
import { type ArbreNode } from '@/lib/axeArbre'
import {
  type AxeCroise,
  type CelluleCroisee,
  type CelluleIds,
  celluleKey,
  type Layout,
} from '@/lib/axesCroises'
import { clsxm } from '@/lib/clsxm'
import {
  celluleIdsOf,
  emphasisOf,
  referenceOf,
  strongerEmphasis,
  toneOf,
} from '@/lib/croisementTable'

const ROW_INDENT = 16

export function CroisementGrid({
  axes,
  layout,
  fixedIds,
  rows,
  columns,
  saisies,
  resolve,
  active,
  isCollapsed,
  onToggle,
  onActivate,
  onSaisie,
}: {
  axes: ReadonlyArray<AxeCroise>
  layout: Layout
  fixedIds: ReadonlyArray<string>
  rows: ReadonlyArray<ArbreNode>
  // [undefined] : pas d'axe en colonnes, une seule colonne de valeurs.
  columns: ReadonlyArray<ArbreNode | undefined>
  saisies: Readonly<Record<string, string>>
  resolve: (ids: CelluleIds) => CelluleCroisee
  active: CelluleIds | null
  isCollapsed: (target: { axe: AxeCroise; id: string }) => boolean
  onToggle: (target: { axe: AxeCroise; id: string }) => void
  onActivate: (ids: CelluleIds) => void
  onSaisie: (saisie: { key: string; value: string }) => void
}) {
  const rowsAxe = axes[layout.rows]
  const columnsAxe = layout.columns === null ? undefined : axes[layout.columns]
  if (!rowsAxe) return null
  const precedents = new Set((active ? resolve(active).children : []).map(celluleKey))
  const activeKey = active ? celluleKey(active) : null

  return (
    <div className="min-h-0 flex-1 overflow-auto">
      <table className="w-max border-separate border-spacing-0 text-sm">
        <thead>
          <tr>
            <th className="sticky top-0 left-0 z-30 min-w-56 border-r border-b border-border-strong bg-surface-muted px-3 py-2 text-left text-xs font-semibold text-text-muted">
              {rowsAxe.nom} ↓{columnsAxe ? ` · ${columnsAxe.nom} →` : ''}
            </th>
            {columns.map((column) => (
              <th
                key={column?.id ?? 'valeur'}
                className={clsxm(
                  'sticky top-0 z-20 min-w-32 border-r border-b border-border-strong px-3 py-2 text-right align-bottom text-xs whitespace-nowrap text-text',
                  EMPHASIS_CLASS[emphasisOf(column?.kind)],
                )}
              >
                {column && columnsAxe ? (
                  <NodeHeader
                    node={column}
                    isCollapsed={isCollapsed({ axe: columnsAxe, id: column.id })}
                    onToggle={() => onToggle({ axe: columnsAxe, id: column.id })}
                    align="right"
                  />
                ) : (
                  'Valeur'
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              <th
                className={clsxm(
                  'sticky left-0 z-10 max-w-md border-r border-b border-r-border-strong border-b-border px-2 py-1 text-left text-sm',
                  EMPHASIS_CLASS[emphasisOf(row.kind)],
                )}
              >
                <div style={{ paddingLeft: row.niveau * ROW_INDENT }}>
                  <NodeHeader
                    node={row}
                    isCollapsed={isCollapsed({ axe: rowsAxe, id: row.id })}
                    onToggle={() => onToggle({ axe: rowsAxe, id: row.id })}
                  />
                </div>
              </th>
              {columns.map((column) => {
                const ids = celluleIdsOf({ layout, fixedIds, row: row.id, column: column?.id })
                const key = celluleKey(ids)
                return (
                  <CroisementCell
                    key={key}
                    cellule={resolve(ids)}
                    emphasis={strongerEmphasis({
                      first: emphasisOf(row.kind),
                      second: emphasisOf(column?.kind),
                    })}
                    saisie={saisies[key] ?? ''}
                    tone={toneOf({ key, activeKey, precedents })}
                    label={referenceOf({ axes, ids })}
                    onActivate={() => onActivate(ids)}
                    onSaisie={(value) => onSaisie({ key, value })}
                  />
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
