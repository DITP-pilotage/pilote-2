import { memo } from 'react'

import { GrilleCellule } from '@/components/grille-valeurs/GrilleCellule'
import { type LigneGrille, type PositionCellule } from '@/lib/grilleValeurs'

// Une ligne de la grille. Mémoïsée : une sélection ne redessine que la ligne
// quittée et la ligne atteinte.
export const GrilleLigne = memo(function GrilleLigne({
  gridId,
  ligne,
  selectedColonne,
  tabStopColonne,
  onSelect,
}: {
  gridId: string
  ligne: LigneGrille
  // Colonne sélectionnée sur cette ligne, ou `null`.
  selectedColonne: number | null
  // Colonne de l'arrêt de tabulation de la grille sur cette ligne, ou `null`.
  tabStopColonne: number | null
  onSelect: (position: PositionCellule) => void
}) {
  return (
    <tr className="bg-surface">
      <th
        scope="row"
        className="border-b border-r border-border bg-surface-muted text-center text-xs font-normal text-text-muted"
      >
        {ligne.numero}
      </th>
      {ligne.cellules.map((cellule, colonne) => (
        <GrilleCellule
          key={colonne}
          gridId={gridId}
          cellule={cellule}
          position={{ ligne: ligne.index, colonne }}
          isSelected={selectedColonne === colonne}
          isTabStop={tabStopColonne === colonne}
          onSelect={onSelect}
        />
      ))}
    </tr>
  )
})
