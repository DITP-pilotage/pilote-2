import { Popover as PopoverPrimitive } from 'radix-ui'
import { type ReactNode } from 'react'

import { CelluleContenu } from '@/components/grille-valeurs/CelluleContenu'
import { clsxm } from '@/lib/clsxm'
import { type CelluleGrille, cellDomId, type PositionCellule } from '@/lib/grilleValeurs'

export function GrilleCellule({
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
  // Absent : la grille est en lecture seule.
  onEdit: ((position: PositionCellule) => void) | undefined
  onCloseEditor: () => void
}) {
  const button = (
    <button
      type="button"
      id={cellDomId(position)}
      tabIndex={isSelected ? 0 : -1}
      aria-pressed={isSelected}
      onClick={() => onSelect(position)}
      onDoubleClick={() => onEdit?.(position)}
      className={clsxm(
        'flex h-[35px] w-full cursor-cell items-center gap-2 px-3 text-left text-[13px] focus:outline-none',
        cellule.alignRight && 'justify-end',
        cellule.isWarning && 'bg-warning-tinted',
        // Un anneau intérieur plutôt qu'un outline : il reste dans la case, sans déborder sur
        // les bordures des cellules voisines.
        isSelected && 'bg-primary-tinted ring-2 ring-inset ring-primary',
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
