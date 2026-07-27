import { zodResolver } from '@hookform/resolvers/zod'
import type { CollectionApiModel } from '@pilote/kpilote-shared/collection'
import { collectionVisibiliteSchema } from '@pilote/kpilote-shared/collection'
import { Controller, useForm } from 'react-hook-form'
import { z } from 'zod'

import { Button } from '@pilote/kpilote-ui/Button'
import { FieldInput } from '@pilote/kpilote-ui/FieldInput'
import { FieldSelect } from '@pilote/kpilote-ui/FieldSelect'
import { FieldTextarea } from '@pilote/kpilote-ui/FieldTextarea'
import { useAppConfig } from '@/context/AppConfigContext'
import { clsxm } from '@/lib/clsxm'
import { emptyToNull } from '@/lib/emptyToNull'

const collectionFormSchema = z.object({
  nom: z.string().trim().min(1, 'Le nom est requis'),
  description: z.string(),
  visibilite: collectionVisibiliteSchema,
})

export type CollectionFormValues = z.infer<typeof collectionFormSchema>

const VISIBILITE_OPTIONS = [
  { value: 'PUBLIC', label: 'PUBLIC — lisible par tout principal authentifié' },
  { value: 'PRIVE', label: 'PRIVE — réservé aux principals ayant une permission' },
] as const

export const buildCollectionInitialValues = (
  collection?: CollectionApiModel,
): CollectionFormValues => ({
  nom: collection?.nom ?? '',
  description: collection?.description ?? '',
  visibilite: collection?.visibilite ?? 'PUBLIC',
})

export const toCollectionBody = (values: CollectionFormValues) => ({
  nom: values.nom,
  description: emptyToNull(values.description),
  visibilite: values.visibilite,
})

export function CollectionForm({
  mode,
  initial,
  pending,
  onSubmit,
  onCancel,
}: {
  mode: 'create' | 'update'
  initial: CollectionFormValues
  pending: boolean
  onSubmit: (values: CollectionFormValues) => void
  onCancel: () => void
}) {
  const { isProd } = useAppConfig()
  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<CollectionFormValues>({
    resolver: zodResolver(collectionFormSchema),
    mode: 'onChange',
    defaultValues: initial,
  })

  const submitLabel = pending
    ? mode === 'create'
      ? 'Création…'
      : 'Enregistrement…'
    : isProd
      ? mode === 'create'
        ? '🚨 Créer en Prod'
        : '🚨 Enregistrer en Prod'
      : mode === 'create'
        ? 'Créer la collection'
        : 'Enregistrer'

  return (
    <form onSubmit={(event) => void handleSubmit(onSubmit)(event)}>
      <div className="rounded-xl border border-border bg-surface p-6">
        <div className="mb-5">
          <FieldInput
            label="Nom"
            required
            placeholder="Santé de proximité"
            error={errors.nom?.message}
            {...register('nom')}
          />
        </div>

        <div className="mb-5">
          <FieldTextarea
            label="Description"
            rows={3}
            placeholder="À quoi sert cette collection ?"
            error={errors.description?.message}
            {...register('description')}
          />
        </div>

        <div className="mb-2">
          <Controller
            control={control}
            name="visibilite"
            render={({ field, fieldState }) => (
              <FieldSelect
                label="Visibilité"
                required
                options={VISIBILITE_OPTIONS}
                value={field.value}
                onValueChange={(value) => field.onChange(collectionVisibiliteSchema.parse(value))}
                onBlur={field.onBlur}
                error={fieldState.error?.message}
              />
            )}
          />
        </div>
      </div>

      <div className="mt-5 flex justify-end gap-3">
        <Button variant="secondary" type="button" onClick={onCancel}>
          Annuler
        </Button>
        <Button
          type="submit"
          disabled={!isValid || pending}
          className={clsxm(isProd && 'bg-red-marianne hover:bg-red-marianne')}
        >
          {submitLabel}
        </Button>
      </div>
    </form>
  )
}
