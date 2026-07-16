import { useSuspenseQuery } from '@tanstack/react-query'
import { Trash2 } from 'lucide-react'
import { useFieldArray, useWatch, type UseFormRegister } from 'react-hook-form'

import { ReferentielPicker } from '@/components/indicateurs/ReferentielPicker'
import { useIndicateurFormContext } from '@/components/indicateurs/indicateurFormContext'
import { type IndicateurFormValues } from '@/components/indicateurs/indicateurFormSchema'
import { FieldSelect } from '@/components/ui/FieldSelect'
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
      <p className="mb-4 text-xs text-text-subtle">
        ⚠ Cette liste remplace <b>intégralement</b> l'existant (replace-all). Retirer une ligne
        supprime le lien.
      </p>

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
            register={form.register}
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
  register,
  onRemove,
}: {
  index: number
  referentielNom: string
  register: UseFormRegister<IndicateurFormValues>
  onRemove: () => void
}) {
  return (
    <li className="flex items-center gap-2.5 rounded-lg border border-border bg-surface-muted px-3 py-2">
      <span className="flex-[2] text-sm text-text">{referentielNom}</span>
      <div className="flex-1">
        <FieldSelect
          label="Fonction d'agrégation"
          hideLabel
          {...register(`referentiels.${index}.fonctionAgregation`)}
        >
          {Object.entries(AGREGATION_LABEL).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </FieldSelect>
      </div>
      <button type="button" onClick={onRemove} className="text-accent-rouge" aria-label="Retirer">
        <Trash2 className="size-4" />
      </button>
    </li>
  )
}
