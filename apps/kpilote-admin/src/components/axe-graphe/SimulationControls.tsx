import { type FonctionAgregationAxe } from '@pilote/kpilote-shared/axe'
import { Dices, Eraser, Grid3x3 } from 'lucide-react'

import { Segmented } from '@/components/axe-graphe/Segmented'
import { Button } from '@pilote/kpilote-ui/Button'

export function SimulationControls({
  fonction,
  onFonctionChange,
  onRandomize,
  onClear,
}: {
  fonction: FonctionAgregationAxe
  onFonctionChange: (fonction: FonctionAgregationAxe) => void
  onRandomize: (full: boolean) => void
  onClear: () => void
}) {
  return (
    <>
      <Segmented
        value={fonction}
        onChange={onFonctionChange}
        options={[
          { value: 'SUM', label: 'Somme' },
          { value: 'AVG', label: 'Moyenne' },
        ]}
      />
      <Button
        size="sm"
        variant="tertiary"
        onClick={() => onRandomize(false)}
        title="Valeurs au hasard, avec des cases vides"
      >
        <Dices />
      </Button>
      <Button
        size="sm"
        variant="tertiary"
        onClick={() => onRandomize(true)}
        title="Valeurs au hasard, sans case vide"
      >
        <Grid3x3 />
      </Button>
      <Button size="sm" variant="tertiary" onClick={onClear} title="Vider">
        <Eraser />
      </Button>
    </>
  )
}
