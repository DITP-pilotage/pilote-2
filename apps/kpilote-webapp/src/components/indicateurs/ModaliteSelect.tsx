import { FieldSelect } from '@pilote/kpilote-ui/FieldSelect'
import { useMemo } from 'react'

import { type AxeWithModalites, orderModalites } from '@/lib/axes/selection'

export function ModaliteSelect({
  axe,
  value,
  onChange,
}: {
  axe: AxeWithModalites
  value: string | null
  onChange: (modalite: string | null) => void
}) {
  const options = useMemo(
    () => [
      { value: '', label: 'Tous' },
      ...orderModalites(axe.modalites).map(({ modalite, depth }) => ({
        value: modalite.id,
        label: <span style={{ paddingLeft: `${depth * 0.875}rem` }}>{modalite.nom}</span>,
      })),
    ],
    [axe.modalites],
  )

  return (
    <FieldSelect
      label={axe.nom}
      value={value ?? ''}
      onValueChange={(next) => onChange(next === '' ? null : next)}
      options={options}
    />
  )
}
