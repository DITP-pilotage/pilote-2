import { Field } from '@pilote/kpilote-ui/Field'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@pilote/kpilote-ui/Select'
import { useId, useMemo } from 'react'

import { type AxeWithModalites, orderModalites } from '@/lib/axes/selection'

// Radix réserve la valeur "" au vidage du select : « Tous » prend une valeur à part.
const TOUS = ' tous'

export function ModaliteSelect({
  axe,
  value,
  onChange,
}: {
  axe: AxeWithModalites
  value: string | null
  onChange: (modalite: string | null) => void
}) {
  const labelId = useId()
  const modalites = useMemo(() => orderModalites(axe.modalites), [axe.modalites])

  return (
    <Field label={axe.nom} labelId={labelId}>
      <Select value={value ?? TOUS} onValueChange={(next) => onChange(next === TOUS ? null : next)}>
        <SelectTrigger aria-labelledby={labelId} className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={TOUS}>Tous</SelectItem>
          {/* Le retrait est posé sur la ligne, pas sur son texte : Radix recopie le
              texte de l'option choisie dans le bouton, qui reste ainsi aligné. */}
          {modalites.map(({ modalite, depth }) => (
            <SelectItem
              key={modalite.id}
              value={modalite.id}
              style={{ paddingLeft: `${0.625 + depth * 0.875}rem` }}
            >
              {modalite.nom}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Field>
  )
}
