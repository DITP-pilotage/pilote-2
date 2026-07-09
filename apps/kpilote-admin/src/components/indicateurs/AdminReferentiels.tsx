import { useSuspenseQuery } from '@tanstack/react-query'
import { Plus, Trash2 } from 'lucide-react'
import { useFieldArray, type UseFormRegister } from 'react-hook-form'

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
  const { data: options } = useSuspenseQuery(referentielsAllQueryOptions())

  return (
    <div className="border-t border-border pt-5">
      <div className="mb-1 flex items-center justify-between">
        <span className="text-sm font-bold">Référentiels liés</span>
        <button
          type="button"
          onClick={() => append({ id: '', fonctionAgregation: 'SUM' })}
          className="flex items-center gap-1 text-sm font-semibold text-primary"
        >
          <Plus className="size-4" /> Ajouter
        </button>
      </div>
      <p className="mb-4 text-xs text-text-subtle">
        ⚠ Cette liste remplace <b>intégralement</b> l'existant (replace-all). Retirer une ligne
        supprime le lien.
      </p>
      {fields.map((field, index) => (
        <ReferentielRow
          key={field.id}
          index={index}
          register={form.register}
          error={form.formState.errors.referentiels?.[index]?.id?.message}
          options={options}
          onRemove={() => remove(index)}
        />
      ))}
    </div>
  )
}

function ReferentielRow({
  index,
  register,
  error,
  options,
  onRemove,
}: {
  index: number
  register: UseFormRegister<IndicateurFormValues>
  error?: string | undefined
  options: { id: string; nom: string }[]
  onRemove: () => void
}) {
  return (
    <div className="mb-2.5 flex items-start gap-2.5 rounded-lg border border-border bg-surface-muted px-3 py-2.5">
      <div className="flex-[2]">
        <FieldSelect
          label="Référentiel"
          hideLabel
          required
          error={error}
          aria-invalid={error ? true : undefined}
          {...register(`referentiels.${index}.id`)}
        >
          <option value="" disabled>
            Choisir un référentiel…
          </option>
          {options.map((option) => (
            <option key={option.id} value={option.id}>
              {option.id} · {option.nom}
            </option>
          ))}
        </FieldSelect>
      </div>
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
      <button type="button" onClick={onRemove} className="mt-2 text-accent" aria-label="Retirer">
        <Trash2 className="size-4" />
      </button>
    </div>
  )
}
