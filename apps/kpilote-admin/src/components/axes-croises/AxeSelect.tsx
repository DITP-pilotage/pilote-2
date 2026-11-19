import { FieldSelect } from '@pilote/kpilote-ui/FieldSelect'
import { type AxeCroise } from '@/lib/axesCroises'

const NO_AXE = ''

export function AxeSelect({
  label,
  axes,
  value,
  allowNone = false,
  onChange,
}: {
  label: string
  axes: ReadonlyArray<AxeCroise>
  value: number | null
  allowNone?: boolean
  onChange: (index: number | null) => void
}) {
  const options = axes.map((axe, index) => ({
    value: String(index),
    label: `Axe ${index + 1} · ${axe.nom}`,
  }))
  return (
    <div className="w-56">
      <FieldSelect
        label={label}
        value={value === null ? NO_AXE : String(value)}
        onValueChange={(next) => onChange(next === NO_AXE ? null : Number(next))}
        options={allowNone ? [{ value: NO_AXE, label: 'Aucun axe' }, ...options] : options}
      />
    </div>
  )
}
