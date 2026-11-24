import { TOUS_ID } from '@pilote/kpilote-shared/modaliteTree'
import { FieldSelect } from '@pilote/kpilote-ui/FieldSelect'

import { FixedAxeSelect } from '@/components/indicateurs/tableau-valeurs/FixedAxeSelect'
import {
  type AxeTableau,
  type Layout,
  withColumnsAxe,
  withRowsAxe,
} from '@/lib/axes/tableauValeurs'

const PERIODES_VALUE = 'periodes'

// Ce que montre le tableau croisé : l'axe en lignes, l'axe ou les périodes en colonnes, la
// période quand un axe est en colonnes, et la modalité de chaque axe fixé.
export function TableauCroiseControls({
  axes,
  layout,
  periodes,
  periode,
  fixedIds,
  formatPeriode,
  onLayoutChange,
  onPeriodeChange,
  onFixedChange,
}: {
  axes: ReadonlyArray<AxeTableau>
  layout: Layout
  periodes: ReadonlyArray<string>
  periode: string
  fixedIds: ReadonlyArray<string>
  formatPeriode: (periode: string) => string
  onLayoutChange: (layout: Layout) => void
  onPeriodeChange: (periode: string) => void
  onFixedChange: (change: { index: number; id: string }) => void
}) {
  const axeOptions = axes.map((axe, index) => ({
    value: String(index),
    label: `Axe ${index + 1} · ${axe.nom}`,
  }))
  const fixedAxes = axes
    .map((axe, index) => ({ axe, index }))
    .filter(({ index }) => index !== layout.rows && index !== layout.columns)
  return (
    <>
      <div className="w-56">
        <FieldSelect
          label="Lignes"
          value={String(layout.rows)}
          onValueChange={(value) => onLayoutChange(withRowsAxe({ layout, index: Number(value) }))}
          options={axeOptions}
        />
      </div>
      {axes.length > 1 ? (
        <div className="w-56">
          <FieldSelect
            label="Colonnes"
            value={layout.columns === null ? PERIODES_VALUE : String(layout.columns)}
            onValueChange={(value) =>
              onLayoutChange(
                withColumnsAxe({
                  layout,
                  index: value === PERIODES_VALUE ? null : Number(value),
                  axesCount: axes.length,
                }),
              )
            }
            options={[{ value: PERIODES_VALUE, label: 'Périodes' }, ...axeOptions]}
          />
        </div>
      ) : null}
      {layout.columns === null ? null : (
        <div className="w-44">
          <FieldSelect
            label="Période"
            value={periode}
            onValueChange={onPeriodeChange}
            options={periodes.toReversed().map((date) => ({
              value: date,
              label: formatPeriode(date),
            }))}
          />
        </div>
      )}
      {fixedAxes.map(({ axe, index }) => (
        <FixedAxeSelect
          key={axe.id}
          axe={axe}
          index={index}
          value={fixedIds[index] ?? TOUS_ID}
          onChange={(id) => onFixedChange({ index, id })}
        />
      ))}
    </>
  )
}
