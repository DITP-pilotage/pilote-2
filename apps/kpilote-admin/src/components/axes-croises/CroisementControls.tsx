import { Dices, Eraser, Grid3x3 } from 'lucide-react'

import { AxeSelect } from '@/components/axes-croises/AxeSelect'
import { FixedAxeSelect } from '@/components/axes-croises/FixedAxeSelect'
import { Button } from '@pilote/kpilote-ui/Button'
import { TOUS_ID } from '@/lib/axeArbre'
import { type AxeCroise, type Layout, withColumnsAxe, withRowsAxe } from '@/lib/axesCroises'

// La disposition (lignes, colonnes, axes fixés) et les valeurs d'exemple.
export function CroisementControls({
  axes,
  layout,
  fixedIds,
  hasSaisissable,
  onLayoutChange,
  onFixedChange,
  onRandomize,
  onClear,
}: {
  axes: ReadonlyArray<AxeCroise>
  layout: Layout
  fixedIds: ReadonlyArray<string>
  hasSaisissable: boolean
  onLayoutChange: (layout: Layout) => void
  onFixedChange: (change: { index: number; id: string }) => void
  onRandomize: (full: boolean) => void
  onClear: () => void
}) {
  const fixedAxes = axes
    .map((axe, index) => ({ axe, index }))
    .filter(({ index }) => index !== layout.rows && index !== layout.columns)
  return (
    <div className="flex flex-wrap items-start gap-x-6 gap-y-3 border-b border-border px-6 py-3">
      <AxeSelect
        label="Lignes"
        axes={axes}
        value={layout.rows}
        onChange={(index) => {
          if (index !== null) onLayoutChange(withRowsAxe({ layout, index }))
        }}
      />
      {axes.length > 1 ? (
        <AxeSelect
          label="Colonnes"
          axes={axes}
          value={layout.columns}
          allowNone
          onChange={(index) => onLayoutChange(withColumnsAxe({ layout, index }))}
        />
      ) : null}
      {fixedAxes.map(({ axe, index }) => (
        <FixedAxeSelect
          key={axe.id}
          axe={axe}
          index={index}
          value={fixedIds[index] ?? TOUS_ID}
          onChange={(id) => onFixedChange({ index, id })}
        />
      ))}
      <span className="ml-auto flex items-center gap-1 self-center">
        <Button
          size="sm"
          variant="tertiary"
          title="Valeurs au hasard, avec des cases vides"
          disabled={!hasSaisissable}
          onClick={() => onRandomize(false)}
        >
          <Dices />
        </Button>
        <Button
          size="sm"
          variant="tertiary"
          title="Valeurs au hasard, sans case vide"
          disabled={!hasSaisissable}
          onClick={() => onRandomize(true)}
        >
          <Grid3x3 />
        </Button>
        <Button size="sm" variant="tertiary" title="Vider" onClick={onClear}>
          <Eraser />
        </Button>
      </span>
    </div>
  )
}
