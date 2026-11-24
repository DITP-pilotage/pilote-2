import { CelluleContenu } from '@/components/grille-valeurs/CelluleContenu'
import { clsxm } from '@/lib/clsxm'
import { type CelluleGrille, cellDomId, type PositionCellule } from '@/lib/grilleValeurs'

export function GrilleCellule({
  gridId,
  cellule,
  position,
  isSelected,
  onSelect,
}: {
  gridId: string
  cellule: CelluleGrille
  position: PositionCellule
  isSelected: boolean
  onSelect: (position: PositionCellule) => void
}) {
  return (
    <td className="border-b border-r border-border p-0 last:border-r-0">
      <button
        type="button"
        id={cellDomId({ gridId, position })}
        tabIndex={isSelected ? 0 : -1}
        aria-pressed={isSelected}
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
