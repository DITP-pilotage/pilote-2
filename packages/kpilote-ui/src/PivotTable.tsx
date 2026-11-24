import { ChevronDown, ChevronRight } from 'lucide-react'
import { type ReactNode } from 'react'

import { clsxm } from './clsxm'

// Poids d'une ligne ou d'une colonne : `base` pour une donnée de détail, `sous-total` pour un
// regroupement, `total` pour la marginale. Une cellule prend le poids le plus fort de sa ligne
// et de sa colonne.
export type PivotEmphase = 'base' | 'sous-total' | 'total'

export type PivotHeader = {
  id: string
  // Nom en texte brut, pour les libellés accessibles.
  name: string
  label: ReactNode
  title?: string | undefined
  // Retrait, en niveaux, d'une ligne d'arbre.
  depth?: number | undefined
  emphase?: PivotEmphase | undefined
  // Repère devant le libellé (pastille de type, icône…).
  marker?: ReactNode | undefined
  toggle?: { isCollapsed: boolean; onToggle: () => void } | undefined
  highlighted?: boolean | undefined
}

export type PivotCellTone = 'active' | 'precedent'

export type PivotCell = {
  content: ReactNode
  tone?: PivotCellTone | undefined
  className?: string | undefined
  label?: string | undefined
  onActivate?: (() => void) | undefined
}

const EMPHASE_RANK: Record<PivotEmphase, number> = { base: 0, 'sous-total': 1, total: 2 }
const EMPHASES: ReadonlyArray<PivotEmphase> = ['base', 'sous-total', 'total']

const strongestOf = (emphases: ReadonlyArray<PivotEmphase | undefined>): PivotEmphase =>
  EMPHASES[Math.max(...emphases.map((emphase) => EMPHASE_RANK[emphase ?? 'base']))] ?? 'base'

const EMPHASE_HEADER: Record<PivotEmphase, string> = {
  base: 'bg-surface font-normal',
  'sous-total': 'bg-surface-muted font-semibold',
  total: 'bg-surface-tinted font-bold',
}

const EMPHASE_CELL: Record<PivotEmphase, string> = {
  base: 'bg-surface',
  'sous-total': 'bg-surface-muted font-semibold',
  total: 'bg-surface-tinted font-bold',
}

const TONE_CLASS: Record<PivotCellTone, string> = {
  // Un anneau intérieur : il reste dans la case, sans déborder sur les bordures voisines.
  active: 'ring-2 ring-inset ring-primary',
  precedent: 'bg-primary-tinted',
}

const ROW_INDENT_PX = 16

// Tableau croisé à en-têtes collants : des lignes (éventuellement en arbre, repliables), des
// colonnes, et une cellule par croisement que l'appelant décrit.
export function PivotTable({
  corner,
  rows,
  columns,
  cellOf,
}: {
  corner: ReactNode
  rows: ReadonlyArray<PivotHeader>
  columns: ReadonlyArray<PivotHeader>
  cellOf: (params: { row: PivotHeader; column: PivotHeader }) => PivotCell
}) {
  return (
    <table className="w-max border-separate border-spacing-0 text-sm">
      <thead>
        <tr>
          <th className="sticky top-0 left-0 z-30 min-w-56 border-r border-b border-border-strong bg-surface-muted px-3 py-2 text-left text-xs font-semibold text-text-muted">
            {corner}
          </th>
          {columns.map((column) => (
            <th
              key={column.id}
              title={column.title}
              className={clsxm(
                'sticky top-0 z-20 min-w-28 border-r border-b border-border-strong px-3 py-2 text-right align-bottom text-xs whitespace-nowrap text-text',
                EMPHASE_HEADER[column.emphase ?? 'base'],
                column.highlighted && 'bg-primary-tinted text-primary',
              )}
            >
              <HeaderLabel header={column} align="right" />
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.id}>
            <th
              title={row.title}
              className={clsxm(
                'sticky left-0 z-10 max-w-md border-r border-b border-r-border-strong border-b-border px-2 py-1 text-left text-sm',
                EMPHASE_HEADER[row.emphase ?? 'base'],
              )}
            >
              <div style={{ paddingLeft: (row.depth ?? 0) * ROW_INDENT_PX }}>
                <HeaderLabel header={row} align="left" />
              </div>
            </th>
            {columns.map((column) => (
              <Cell
                key={column.id}
                cell={cellOf({ row, column })}
                emphase={strongestOf([row.emphase, column.emphase])}
              />
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function HeaderLabel({ header, align }: { header: PivotHeader; align: 'left' | 'right' }) {
  return (
    <span className={clsxm('flex items-center gap-1.5', align === 'right' && 'justify-end')}>
      {header.toggle ? (
        <button
          type="button"
          onClick={header.toggle.onToggle}
          aria-expanded={!header.toggle.isCollapsed}
          aria-label={`${header.toggle.isCollapsed ? 'Déplier' : 'Replier'} ${header.name}`}
          className="flex size-5 items-center justify-center rounded text-text-muted hover:bg-surface-muted hover:text-primary"
        >
          {header.toggle.isCollapsed ? (
            <ChevronRight className="size-3.5" />
          ) : (
            <ChevronDown className="size-3.5" />
          )}
        </button>
      ) : null}
      {header.marker}
      <span className="truncate">{header.label}</span>
    </span>
  )
}

function Cell({ cell, emphase }: { cell: PivotCell; emphase: PivotEmphase }) {
  return (
    <td
      className={clsxm(
        'h-8 min-w-28 border-r border-b border-border p-0 text-right tabular-nums',
        EMPHASE_CELL[emphase],
        cell.className,
        cell.tone && TONE_CLASS[cell.tone],
      )}
    >
      <button
        type="button"
        onClick={cell.onActivate}
        aria-label={cell.label}
        className="flex h-full w-full items-center justify-end gap-1 px-3"
      >
        {cell.content}
      </button>
    </td>
  )
}
