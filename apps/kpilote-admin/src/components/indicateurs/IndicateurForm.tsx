import { zodResolver } from '@hookform/resolvers/zod'
import { useMemo } from 'react'
import { Controller, FormProvider, useForm, useWatch } from 'react-hook-form'

import {
  PERIODE_MISE_A_JOUR_LABELS,
  PERIODES_MISE_A_JOUR,
  UNITE_DUREE_LABELS,
  UNITES_DUREE,
} from '@pilote/kpilote-shared/indicateur'

import { AdminReferentiels } from '@/components/indicateurs/AdminReferentiels'
import { AdminResponsables } from '@/components/indicateurs/AdminResponsables'
import { UnitePicker } from '@/components/indicateurs/UnitePicker'
import {
  buildIndicateurFormSchema,
  type IndicateurFormValues,
} from '@/components/indicateurs/indicateurFormSchema'
import { Button } from '@pilote/kpilote-ui/Button'
import { Field } from '@/components/ui/Field'
import { FieldInput } from '@/components/ui/FieldInput'
import { FieldSelect } from '@/components/ui/FieldSelect'
import { FieldTextarea } from '@/components/ui/FieldTextarea'
import { SegmentedField } from '@/components/ui/SegmentedField'
import { useAppConfig } from '@/context/AppConfigContext'

const VISIBILITE_OPTIONS = [
  { value: 'PUBLIC', label: 'Public' },
  { value: 'PRIVE', label: 'Privé' },
] as const

export function IndicateurForm({
  mode,
  initial,
  pending,
  onSubmit,
  onCancel,
}: {
  mode: 'create' | 'edit'
  initial: IndicateurFormValues
  pending: boolean
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
  const visibilite = useWatch({ control: form.control, name: 'visibilite' })

  return (
    <FormProvider {...form}>
      <form onSubmit={(event) => void form.handleSubmit(onSubmit)(event)}>
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
              <SegmentedField
                label="Visibilité"
                value={visibilite}
                onValueChange={(value) =>
                  form.setValue('visibilite', value, { shouldValidate: true })
                }
                options={VISIBILITE_OPTIONS}
              />
            </div>
            <div className="flex-1">
              <Controller
                control={form.control}
                name="unite"
                render={({ field }) => (
                  <UnitePicker label="Unité" value={field.value ?? ''} onChange={field.onChange} />
                )}
              />
            </div>
          </div>

          <div className="mb-6 border-t border-border pt-5">
            <span className="mb-4 block text-sm font-bold">Métadonnées</span>

            <div className="mb-5">
              <FieldTextarea label="Description" rows={3} {...form.register('description')} />
            </div>

            <div className="mb-5">
              <FieldTextarea
                label="Méthode de calcul"
                rows={3}
                {...form.register('methodeCalcul')}
              />
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

            <div className="mt-5 flex gap-4">
              <div className="flex-1">
                <FieldInput
                  label="Délai de mise à disposition"
                  type="number"
                  min={1}
                  placeholder="ex. 6"
                  error={form.formState.errors.delaiNombre?.message}
                  {...form.register('delaiNombre')}
                />
              </div>
              <div className="flex-1">
                <FieldSelect
                  label="Unité du délai"
                  error={form.formState.errors.delaiUnite?.message}
                  {...form.register('delaiUnite')}
                >
                  <option value="">Aucune</option>
                  {UNITES_DUREE.map((unite) => (
                    <option key={unite} value={unite}>
                      {UNITE_DUREE_LABELS[unite]}
                    </option>
                  ))}
                </FieldSelect>
              </div>
            </div>
          </div>

          <AdminReferentiels />

          <AdminResponsables />
        </div>

        <div className="mt-5 flex justify-end gap-3">
          <Button variant="secondary" type="button" onClick={onCancel}>
            Annuler
          </Button>
          <Button
            type="submit"
            disabled={!form.formState.isValid || pending}
            className={isProd ? 'bg-accent-rouge hover:bg-accent-rouge' : undefined}
          >
            {pending ? 'Enregistrement…' : isProd ? '🚨 Enregistrer en Prod' : 'Enregistrer'}
          </Button>
        </div>
      </form>
    </FormProvider>
  )
}
