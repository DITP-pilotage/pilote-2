import { CelluleContenu } from '@/components/grille-valeurs/CelluleContenu'
import { clsxm } from '@/lib/clsxm'
import { type CelluleGrille, cellDomId, type PositionCellule } from '@/lib/grilleValeurs'

export function GrilleCellule({
  gridId,
  cellule,
  position,
  isSelected,
  isTabStop,
  onSelect,
}: {
  gridId: string
  cellule: CelluleGrille
  position: PositionCellule
  isSelected: boolean
  // Seule cellule de la grille atteignable par la touche Tab.
  isTabStop: boolean
  onSelect: (position: PositionCellule) => void
}) {
  // Une cellule focalisée sans être sélectionnée n'aurait aucun repère visuel
  // (`focus:outline-none`) : entrer dans la grille par Tab la sélectionne.
  const onFocus = () => {
    if (isTabStop && !isSelected) onSelect(position)
  }

  return (
    <td className="border-b border-r border-border p-0 last:border-r-0">
      <button
        type="button"
        id={cellDomId({ gridId, position })}
        tabIndex={isTabStop ? 0 : -1}
        aria-pressed={isSelected}
        onFocus={onFocus}
        onClick={() => onSelect(position)}
        className={clsxm(
          'flex h-8 w-full cursor-cell items-center gap-2 px-3 text-left text-sm focus:outline-none',
          cellule.alignRight && 'justify-end',
          cellule.tone === 'WARNING' && 'bg-warning-tinted',
          // Un anneau intérieur, qui ne déborde pas sur les bordures des cellules voisines.
          isSelected && 'ring-2 ring-inset ring-primary',
        )}
      >
        <CelluleContenu cellule={cellule} />
      </button>
    </td>
  )
}
