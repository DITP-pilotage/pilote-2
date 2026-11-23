import { useCallback, useMemo, useState } from 'react'

import { GrilleValeurs } from '@/components/grille-valeurs/GrilleValeurs'
import { buildLignesValeurs, type LigneCible } from '@/lib/axes/lignesValeurs'
import { type TableauValeursContext } from '@/lib/axes/tableauValeurs'
import { type PositionCellule } from '@/lib/grilleValeurs'

const NO_SELECTION: PositionCellule = { ligne: -1, colonne: 0 }

// Le cube de l'individu décomposé en lignes, comme dans la grille d'import. Une ligne
// sélectionnée s'explique dans la barre de formule, comme une cellule du tableau croisé.
export function VueLignes({
  context,
  individu,
  onActivate,
}: {
  context: TableauValeursContext
  individu: { id: string; nom: string }
  onActivate: (cible: LigneCible) => void
}) {
  const { colonnes, lignes, cibles } = useMemo(
    () => buildLignesValeurs({ context, individu }),
    [context, individu],
  )
  // Aucune ligne sélectionnée au départ, comme la barre de formule (« Aucune cellule »).
  const [selection, setSelection] = useState<PositionCellule>(NO_SELECTION)
  // Stable : la grille ne redessine que la ligne quittée et la ligne atteinte.
  const select = useCallback(
    (position: PositionCellule) => {
      setSelection(position)
      const cible = cibles[position.ligne]
      if (cible) onActivate(cible)
    },
    [cibles, onActivate],
  )
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <GrilleValeurs
        isFramed={false}
        label={`Valeurs de ${individu.nom}`}
        colonnes={colonnes}
        lignes={lignes}
        selection={selection}
        onSelect={select}
        emptyMessage="Aucune valeur sur une combinaison de modalités feuilles."
      />
    </div>
  )
}
