import { useSuspenseQuery } from '@tanstack/react-query'
import { Trash2 } from 'lucide-react'
import { Controller, useFieldArray, useWatch, type Control } from 'react-hook-form'

import { ReferentielPicker } from '@/components/indicateurs/ReferentielPicker'
import { useIndicateurFormContext } from '@/components/indicateurs/indicateurFormContext'
import { type IndicateurFormValues } from '@/components/indicateurs/indicateurFormSchema'
import { FieldSelect } from '@pilote/kpilote-ui/FieldSelect'
import { IconButton } from '@pilote/kpilote-ui/IconButton'
import { Subtitle } from '@pilote/kpilote-ui/Subtitle'
import { referentielsAllQueryOptions } from '@/queries/referentiels'

type FonctionAgregation = 'SUM' | 'AVG' | 'NONE'

const AGREGATION_LABEL: Record<FonctionAgregation, string> = {
  SUM: 'Somme',
  AVG: 'Moyenne',
  NONE: 'Aucune',
}

export function AdminReferentiels() {
  const form = useIndicateurFormContext()
  const { fields, append, remove } = useFieldArray({ control: form.control, name: 'referentiels' })
  const referentielsSelectionnes = useWatch({ control: form.control, name: 'referentiels' })
  const { data: options } = useSuspenseQuery(referentielsAllQueryOptions())

  const nomById = new Map(options.map((option) => [option.id, option.nom]))
  const selectedIds = (referentielsSelectionnes ?? []).map((referentiel) => referentiel.id)

  return (
    <div className="border-t border-border pt-5">
      <span className="mb-1 block text-sm font-bold">Référentiels liés</span>
      <Subtitle className="mb-4">
        ⚠ Cette liste remplace <b>intégralement</b> l'existant (replace-all). Retirer une ligne
        supprime le lien.
      </Subtitle>

      <ReferentielPicker
        excludedIds={selectedIds}
        onSelect={(id) => append({ id, fonctionAgregation: 'SUM' })}
        placeholder="Ajouter un référentiel"
      />

      <ul className="mt-3 space-y-2">
        {fields.map((field, index) => (
          <ReferentielRow
            key={field.id}
            index={index}
            referentielNom={nomById.get(selectedIds[index] ?? '') ?? selectedIds[index] ?? ''}
            control={form.control}
            onRemove={() => remove(index)}
          />
        ))}
      </ul>
    </div>
  )
}

function ReferentielRow({
  index,
  referentielNom,
  control,
  onRemove,
}: {
  index: number
  referentielNom: string
  control: Control<IndicateurFormValues>
  onRemove: () => void
}) {
  return (
    <li className="flex items-center gap-2.5 rounded-lg border border-border bg-surface-muted px-3 py-2">
      <span className="flex-[2] text-sm text-text">{referentielNom}</span>
      <div className="flex-1">
        <Controller
          control={control}
          name={`referentiels.${index}.fonctionAgregation`}
          render={({ field }) => (
            <FieldSelect
              label="Fonction d'agrégation"
              hideLabel
              value={field.value}
              onValueChange={field.onChange}
              onBlur={field.onBlur}
              options={Object.entries(AGREGATION_LABEL).map(([value, label]) => ({ value, label }))}
            />
          )}
        />
      </div>
      <IconButton variant="danger" label="Retirer" onClick={onRemove}>
        <Trash2 />
      </IconButton>
    </li>
  )
}
