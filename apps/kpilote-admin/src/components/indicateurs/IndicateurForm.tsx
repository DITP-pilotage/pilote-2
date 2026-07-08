import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery } from '@tanstack/react-query'
import { Plus, Trash2 } from 'lucide-react'
import { useMemo } from 'react'
import { useFieldArray, useForm, useWatch, type UseFormRegister } from 'react-hook-form'

import {
  PERIODE_MISE_A_JOUR_LABELS,
  PERIODES_MISE_A_JOUR,
  UNITES_INDICATEUR,
  UNITES_INDICATEUR_CONFIG,
} from '@pilote/kpilote-shared/indicateur'

import { fetchAllReferentiels } from '@/api/referentiels'
import {
  buildIndicateurFormSchema,
  type IndicateurFormValues,
} from '@/components/indicateurs/indicateurFormSchema'
import { Button } from '@/components/ui/Button'
import { Field } from '@/components/ui/Field'
import { FieldInput } from '@/components/ui/FieldInput'
import { FieldSelect } from '@/components/ui/FieldSelect'
import { FieldTextarea } from '@/components/ui/FieldTextarea'
import { SegmentedControl } from '@/components/ui/SegmentedControl'
import { useAppConfig } from '@/context/AppConfigContext'

type FonctionAgregation = 'SUM' | 'AVG' | 'NONE'

const AGREGATION_LABEL: Record<FonctionAgregation, string> = {
  SUM: 'Somme',
  AVG: 'Moyenne',
  NONE: 'Aucune',
}

const VISIBILITE_OPTIONS = [
  { value: 'PUBLIC', label: 'Public' },
  { value: 'PRIVE', label: 'Privé' },
] as const

export function IndicateurForm({
  mode,
  initial,
  pending,
  errorMessage,
  onSubmit,
  onCancel,
}: {
  mode: 'create' | 'edit'
  initial: IndicateurFormValues
  pending: boolean
  errorMessage: string | null
  onSubmit: (values: IndicateurFormValues) => void
  onCancel: () => void
}) {
  const { isProd } = useAppConfig()
  const schema = useMemo(() => buildIndicateurFormSchema(mode), [mode])
  const form = useForm<IndicateurFormValues>({
    resolver: zodResolver(schema),
    mode: 'onChange',
    defaultValues: initial,
  })
  const { fields, append, remove } = useFieldArray({ control: form.control, name: 'referentiels' })
  const visibilite = useWatch({ control: form.control, name: 'visibilite' })

  const referentielsQuery = useQuery({
    queryKey: ['referentiels', 'all-for-select'],
    queryFn: () => fetchAllReferentiels(),
  })
  const referentielsOptions = referentielsQuery.data ?? []

  return (
    <form
      onSubmit={(event) => void form.handleSubmit(onSubmit)(event)}
      className="mx-auto max-w-2xl"
    >
      <div className="rounded-xl border border-border bg-surface p-6">
        <div className="mb-5">
          {mode === 'edit' ? (
            <Field label="Identifiant">
              <span className="inline-flex items-center gap-2 rounded-md border border-primary/20 bg-surface-tinted px-3 py-2 font-mono text-sm text-primary">
                {initial.id}{' '}
                <span className="font-sans text-xs text-text-subtle">🔒 non modifiable</span>
              </span>
            </Field>
          ) : (
            <FieldInput
              label="Identifiant"
              placeholder="IND-001"
              className="w-48 font-mono"
              error={form.formState.errors.id?.message}
              {...form.register('id')}
              onChange={(event) =>
                form.setValue('id', event.target.value.toUpperCase(), {
                  shouldValidate: true,
                  shouldDirty: true,
                })
              }
            />
          )}
        </div>

        <div className="mb-5">
          <FieldInput
            label="Nom"
            required
            error={form.formState.errors.nom?.message}
            {...form.register('nom')}
          />
        </div>

        <div className="mb-6 flex gap-4">
          <div className="flex-1">
            <SegmentedControl
              label="Visibilité"
              value={visibilite}
              onValueChange={(value) =>
                form.setValue('visibilite', value, { shouldValidate: true })
              }
              options={VISIBILITE_OPTIONS}
            />
          </div>
          <div className="flex-1">
            <FieldSelect label="Unité" {...form.register('unite')}>
              <option value="">Aucune</option>
              {UNITES_INDICATEUR.map((code) => (
                <option key={code} value={code}>
                  {UNITES_INDICATEUR_CONFIG[code].libelle}
                </option>
              ))}
            </FieldSelect>
          </div>
        </div>

        <div className="mb-6 border-t border-border pt-5">
          <span className="mb-4 block text-sm font-bold">Métadonnées</span>

          <div className="mb-5">
            <FieldTextarea label="Description" rows={3} {...form.register('description')} />
          </div>

          <div className="mb-5">
            <FieldTextarea label="Méthode de calcul" rows={3} {...form.register('methodeCalcul')} />
          </div>

          <div className="mb-5 flex gap-4">
            <div className="flex-1">
              <FieldInput
                label="Source des données"
                error={form.formState.errors.sourceDonnees?.message}
                {...form.register('sourceDonnees')}
              />
            </div>
            <div className="flex-1">
              <FieldInput
                label="URL de la source"
                type="url"
                placeholder="https://…"
                error={form.formState.errors.sourceUrl?.message}
                {...form.register('sourceUrl')}
              />
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex-1">
              <FieldSelect label="Période de mise à jour" {...form.register('periodeMiseAJour')}>
                <option value="">Non renseignée</option>
                {PERIODES_MISE_A_JOUR.map((periode) => (
                  <option key={periode} value={periode}>
                    {PERIODE_MISE_A_JOUR_LABELS[periode]}
                  </option>
                ))}
              </FieldSelect>
            </div>
            <div className="flex-1">
              <FieldInput
                label="Jour de mise à jour"
                type="number"
                min={1}
                max={31}
                placeholder="1–31"
                error={form.formState.errors.jourMiseAJour?.message}
                {...form.register('jourMiseAJour')}
              />
            </div>
          </div>
        </div>

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
              options={referentielsOptions}
              onRemove={() => remove(index)}
            />
          ))}
        </div>
      </div>

      {errorMessage ? (
        <p className="mt-3 text-right text-sm font-medium text-accent">{errorMessage}</p>
      ) : null}

      <div className="mt-5 flex justify-end gap-3">
        <Button variant="secondary" type="button" onClick={onCancel}>
          Annuler
        </Button>
        <Button
          type="submit"
          disabled={!form.formState.isValid || pending}
          className={isProd ? 'bg-accent hover:bg-accent' : undefined}
        >
          {pending ? 'Enregistrement…' : isProd ? '🚨 Enregistrer en Prod' : 'Enregistrer'}
        </Button>
      </div>
    </form>
  )
}

// Une ligne « référentiel lié » : sélection du référentiel + fonction
// d'agrégation, avec message d'erreur si le référentiel n'est pas choisi. Les
// libellés sont masqués (`hideLabel`) car la ligne est en grille horizontale.
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
