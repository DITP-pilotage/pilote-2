import { Sparkles, TriangleAlert } from 'lucide-react'
import { Popover as PopoverPrimitive } from 'radix-ui'
import { memo, type ReactNode } from 'react'

import { clsxm } from '@/lib/clsxm'

import { type CelluleGrille, type LigneGrille, type PositionCellule } from './grille'

export const cellDomId = (position: PositionCellule): string =>
  `import-cellule-${position.ligne}-${position.colonne}`

function CelluleContenu({ cellule }: { cellule: CelluleGrille }) {
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

function GrilleCellule({
  cellule,
  position,
  isSelected,
  editor,
  onSelect,
  onEdit,
  onCloseEditor,
}: {
  cellule: CelluleGrille
  position: PositionCellule
  isSelected: boolean
  // L'éditeur ouvert sur cette cellule, ou `null`.
  editor: ReactNode
  onSelect: (position: PositionCellule) => void
  onEdit: (position: PositionCellule) => void
  onCloseEditor: () => void
}) {
  const button = (
    <button
      type="button"
      id={cellDomId(position)}
      tabIndex={isSelected ? 0 : -1}
      aria-pressed={isSelected}
      onClick={() => onSelect(position)}
      onDoubleClick={() => onEdit(position)}
      className={clsxm(
        'flex h-[35px] w-full cursor-cell items-center gap-2 px-3 text-left text-[13px] focus:outline-none',
        cellule.alignRight && 'justify-end',
        cellule.isWarning && 'bg-warning-tinted',
        isSelected && 'relative z-[1] outline-2 -outline-offset-2 outline-primary',
      )}
    >
      <CelluleContenu cellule={cellule} />
    </button>
  )

  return (
    <td className="border-b border-r border-border p-0 last:border-r-0">
      {editor === null ? (
        button
      ) : (
        <PopoverPrimitive.Root open onOpenChange={(open) => (open ? undefined : onCloseEditor())}>
          <PopoverPrimitive.Anchor asChild>{button}</PopoverPrimitive.Anchor>
          <PopoverPrimitive.Portal>
            <PopoverPrimitive.Content
              align="start"
              sideOffset={4}
              className="z-50 overflow-hidden rounded-md border border-border bg-surface shadow-lg"
            >
              {editor}
            </PopoverPrimitive.Content>
          </PopoverPrimitive.Portal>
        </PopoverPrimitive.Root>
      )}
    </td>
  )
}

// Une ligne de la grille. Mémoïsée : une sélection ne redessine que la ligne
// quittée et la ligne atteinte.
export const GrilleLigne = memo(function GrilleLigne({
  ligne,
  selectedColonne,
  editor,
  onSelect,
  onEdit,
  onCloseEditor,
}: {
  ligne: LigneGrille
  // Colonne sélectionnée sur cette ligne, ou `null`.
  selectedColonne: number | null
  // L'éditeur ouvert sur la cellule sélectionnée de cette ligne, ou `null`.
  editor: ReactNode
  onSelect: (position: PositionCellule) => void
  onEdit: (position: PositionCellule) => void
  onCloseEditor: () => void
}) {
  return (
    <tr className="bg-surface">
      <th
        scope="row"
        className="border-b border-r border-border bg-surface-muted text-center text-xs font-normal text-text-muted"
      >
        {ligne.numero}
      </th>
      {ligne.cellules.map((cellule, colonne) => {
        const isSelected = selectedColonne === colonne
        return (
          <GrilleCellule
            key={colonne}
            cellule={cellule}
            position={{ ligne: ligne.index, colonne }}
            isSelected={isSelected}
            editor={isSelected ? editor : null}
            onSelect={onSelect}
            onEdit={onEdit}
            onCloseEditor={onCloseEditor}
          />
        )
      })}
    </tr>
  )
})
