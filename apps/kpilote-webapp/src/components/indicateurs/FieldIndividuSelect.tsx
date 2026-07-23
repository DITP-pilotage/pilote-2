import { useId } from 'react'

import { Field } from '@pilote/kpilote-ui/Field'

import { IndividuSelect } from '@/components/indicateurs/IndividuSelect'

// Champ « Individu » : Field (label) + IndividuSelect, avec un id généré par
// useId pour l'association label ↔ contrôle. Factorise le combo répété dans les
// tableaux de bord indicateurs/collections.
export function FieldIndividuSelect({
  label = 'Individu',
  referentielIds,
  value,
  onChange,
}: {
  label?: string
  referentielIds: ReadonlyArray<string>
  value: string
  onChange: (next: { individu: string; referentiel: string }) => void
}) {
  const selectId = useId()

  return (
    <Field label={label} htmlFor={selectId}>
      <IndividuSelect
        id={selectId}
        referentielIds={referentielIds}
        value={value}
        onChange={onChange}
      />
    </Field>
  )
}
