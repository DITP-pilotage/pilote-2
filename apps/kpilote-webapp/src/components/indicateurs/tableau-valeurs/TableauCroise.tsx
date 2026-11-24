import { depthFirst, type ModaliteKind } from '@pilote/kpilote-shared/modaliteTree'
import {
  type CombinaisonIds,
  combinaisonKey,
  type CelluleValeur,
} from '@pilote/kpilote-shared/valeursCombinaison'
import {
  type PivotCell,
  type PivotEmphase,
  type PivotHeader,
  PivotTable,
} from '@pilote/kpilote-ui/PivotTable'

import { STATUT_CELL_CLASS } from '@/components/indicateurs/tableau-valeurs/statutCellClass'
import { StatutLegend } from '@/components/indicateurs/tableau-valeurs/StatutLegend'
import { ValeurCellule } from '@/components/indicateurs/tableau-valeurs/ValeurCellule'
import {
  type AxeTableau,
  buildCelluleIds,
  celluleLabelOf,
  type Layout,
  toneOf,
} from '@/lib/axes/tableauValeurs'
import { clsxm } from '@/lib/clsxm'

const KIND_DOT: Record<ModaliteKind, string> = {
  feuille: 'bg-success-425',
  parente: 'bg-primary',
  tous: 'bg-text',
}

const KIND_EMPHASE: Record<ModaliteKind, PivotEmphase> = {
  feuille: 'base',
  parente: 'sous-total',
  tous: 'total',
}

export type CelluleActive = { ids: CombinaisonIds; periode: string }

export function TableauCroise({
  axes,
  layout,
  periodes,
  periode,
  fixedIds,
  collapsedByAxe,
  active,
  precedents,
  celluleOf,
  formatPeriode,
  onToggle,
  onActivate,
}: {
  axes: ReadonlyArray<AxeTableau>
  layout: Layout
  periodes: ReadonlyArray<string>
  periode: string
  fixedIds: ReadonlyArray<string>
  collapsedByAxe: Readonly<Record<string, ReadonlySet<string>>>
  active: CelluleActive | null
  // Clés des combinaisons qui alimentent la cellule active, à sa période.
  precedents: ReadonlySet<string>
  celluleOf: (cellule: CelluleActive) => CelluleValeur
  formatPeriode: (periode: string) => string
  onToggle: (target: { axeId: string; id: string }) => void
  onActivate: (cellule: CelluleActive) => void
}) {
  const rowsAxe = axes[layout.rows]
  const columnsAxe = layout.columns === null ? undefined : axes[layout.columns]
  if (!rowsAxe) return null

  const headersOf = (axe: AxeTableau): PivotHeader[] => {
    const collapsed = collapsedByAxe[axe.id] ?? new Set<string>()
    return depthFirst({ tree: axe.tree, isOpen: (id) => !collapsed.has(id) }).map((node) => ({
      id: node.id,
      name: node.nom,
      label: node.nom,
      depth: node.niveau,
      emphase: KIND_EMPHASE[node.kind],
      marker: <span className={clsxm('size-2 shrink-0 rounded-full', KIND_DOT[node.kind])} />,
      toggle:
        node.children.length > 0
          ? {
              isCollapsed: collapsed.has(node.id),
              onToggle: () => onToggle({ axeId: axe.id, id: node.id }),
            }
          : undefined,
    }))
  }

  const columns: PivotHeader[] = columnsAxe
    ? headersOf(columnsAxe).map((header) => ({ ...header, depth: 0 }))
    : periodes.map((date) => ({
        id: date,
        name: formatPeriode(date),
        label: formatPeriode(date),
        highlighted: active?.periode === date,
      }))

  const cellOf = ({ row, column }: { row: PivotHeader; column: PivotHeader }): PivotCell => {
    const ids = buildCelluleIds({
      layout,
      fixedIds,
      row: row.id,
      column: columnsAxe ? column.id : null,
    })
    const date = columnsAxe ? periode : column.id
    const cellule = celluleOf({ ids, periode: date })
    const key = combinaisonKey(ids)
    const isActive =
      active !== null && combinaisonKey(active.ids) === key && active.periode === date
    const isPrecedent = active?.periode === date && precedents.has(key)
    return {
      content: <ValeurCellule cellule={cellule} />,
      className: STATUT_CELL_CLASS[cellule.statut],
      tone: toneOf({ isActive, isPrecedent }),
      label: `${celluleLabelOf({ axes, ids })}, ${formatPeriode(date)}`,
      onActivate: () => onActivate({ ids, periode: date }),
    }
  }

  return (
    <>
      <div className="min-h-0 flex-1 overflow-auto">
        <PivotTable
          corner={`${rowsAxe.nom} ↓ · ${columnsAxe ? columnsAxe.nom : 'Périodes'} →`}
          rows={headersOf(rowsAxe)}
          columns={columns}
          cellOf={cellOf}
        />
      </div>
      <StatutLegend />
    </>
  )
}
