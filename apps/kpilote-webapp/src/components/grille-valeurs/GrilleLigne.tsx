import { memo, type ReactNode } from 'react'

import { GrilleCellule } from '@/components/grille-valeurs/GrilleCellule'
import { type LigneGrille, type PositionCellule } from '@/lib/grilleValeurs'

// Une ligne de la grille. Mémoïsée : une sélection ne redessine que la ligne
// quittée et la ligne atteinte.
export const GrilleLigne = memo(function GrilleLigne({
  gridId,
  ligne,
  selectedColonne,
  editor,
  onSelect,
  onEdit,
  onCloseEditor,
}: {
  gridId: string
  ligne: LigneGrille
  // Colonne sélectionnée sur cette ligne, ou `null`.
  selectedColonne: number | null
  // L'éditeur ouvert sur la cellule sélectionnée de cette ligne, ou `null`.
  editor: ReactNode
  onSelect: (position: PositionCellule) => void
  onEdit: ((position: PositionCellule) => void) | undefined
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
            gridId={gridId}
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
