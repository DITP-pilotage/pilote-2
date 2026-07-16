import { Plus, Trash2 } from 'lucide-react'
import { Controller, useFieldArray } from 'react-hook-form'

import { ReferentielPicker } from '@/components/indicateurs/ReferentielPicker'
import { useIndicateurFormContext } from '@/components/indicateurs/indicateurFormContext'
import { FieldSelect } from '@/components/ui/FieldSelect'

type FonctionAgregation = 'SUM' | 'AVG' | 'NONE'

const AGREGATION_LABEL: Record<FonctionAgregation, string> = {
  SUM: 'Somme',
  AVG: 'Moyenne',
  NONE: 'Aucune',
}

export function AdminReferentiels() {
  const form = useIndicateurFormContext()
  const { fields, append, remove } = useFieldArray({ control: form.control, name: 'referentiels' })
  const values = form.watch('referentiels') ?? []
  const selectedIds = values.map((value) => value.id).filter(Boolean)

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
          selectedIds={selectedIds}
          onRemove={() => remove(index)}
        />
      ))}
    </div>
  )
}

function ReferentielRow({
  index,
  selectedIds,
  onRemove,
}: {
  index: number
  selectedIds: string[]
  onRemove: () => void
}) {
  const form = useIndicateurFormContext()
  const currentId = form.watch(`referentiels.${index}.id`)
  const excludedIds = selectedIds.filter((id) => id !== currentId)
  const error = form.formState.errors.referentiels?.[index]?.id?.message

  return (
    <div className="mb-2.5 flex items-start gap-2.5 rounded-lg border border-border bg-surface-muted px-3 py-2.5">
      <div className="flex-[2]">
        <Controller
          control={form.control}
          name={`referentiels.${index}.id`}
          render={({ field }) => (
            <ReferentielPicker
              value={field.value}
              onChange={field.onChange}
              excludedIds={excludedIds}
            />
          )}
        />
        {error ? <p className="mt-1 text-xs text-accent">{error}</p> : null}
      </div>
      <div className="flex-1">
        <FieldSelect
          label="Fonction d'agrégation"
          hideLabel
          {...form.register(`referentiels.${index}.fonctionAgregation`)}
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
