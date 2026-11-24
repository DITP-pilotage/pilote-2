import { Popover as PopoverPrimitive } from 'radix-ui'
import { type ReactNode } from 'react'

import { CelluleContenu } from '@/components/grille-valeurs/CelluleContenu'
import { clsxm } from '@/lib/clsxm'
import { type CelluleGrille, cellDomId, type PositionCellule } from '@/lib/grilleValeurs'

export function GrilleCellule({
  gridId,
  cellule,
  position,
  isSelected,
  isTabStop,
  editor,
  onSelect,
  onEdit,
  onCloseEditor,
}: {
  gridId: string
  cellule: CelluleGrille
  position: PositionCellule
  isSelected: boolean
  // Seule cellule de la grille atteignable par la touche Tab.
  isTabStop: boolean
  // Éditeur ouvert sur cette cellule, ou `null`.
  editor: ReactNode
  onSelect: (position: PositionCellule) => void
  // Absent : la grille est en lecture seule.
  onEdit: ((position: PositionCellule) => void) | undefined
  onCloseEditor: () => void
}) {
  const id = cellDomId({ gridId, position })

  // Une cellule focalisée sans être sélectionnée n'aurait aucun repère visuel
  // (`focus:outline-none`) : entrer dans la grille par Tab la sélectionne.
  const onFocus = () => {
    if (isTabStop && !isSelected) onSelect(position)
  }

  const onDoubleClick = () => {
    if (cellule.isEditable) onEdit?.(position)
  }

  // Sans déclencheur, le popover ne rend le focus à personne : la cellule le reprend pour que les
  // flèches déplacent à nouveau la sélection. Un clic sur une autre cellule l'a déjà pris.
  const onCloseAutoFocus = (event: Event) => {
    event.preventDefault()
    if (document.activeElement === document.body) document.getElementById(id)?.focus()
  }

  const button = (
    <button
      type="button"
      id={id}
      tabIndex={isTabStop ? 0 : -1}
      aria-pressed={isSelected}
      onFocus={onFocus}
      onClick={() => onSelect(position)}
      onDoubleClick={onDoubleClick}
      className={clsxm(
        'flex h-8 w-full items-center gap-2 px-3 text-left text-sm focus:outline-none',
        cellule.isEditable ? 'cursor-cell' : 'cursor-default',
        cellule.alignRight && 'justify-end',
        cellule.tone === 'WARNING' && 'bg-warning-tinted',
        // Un anneau intérieur, qui ne déborde pas sur les bordures des cellules voisines.
        isSelected && 'ring-2 ring-inset ring-primary',
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
              onCloseAutoFocus={onCloseAutoFocus}
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
