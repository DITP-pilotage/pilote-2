import { zodResolver } from '@hookform/resolvers/zod'
import { Plus, Trash2 } from 'lucide-react'
import { useMemo } from 'react'
import { useFieldArray, useForm } from 'react-hook-form'
import { z } from 'zod'

import { individuPublicIdSchema } from '@pilote/kpilote-shared/individu'
import { referentielPublicIdSchema } from '@pilote/kpilote-shared/referentiel'

import { Button } from '@pilote/kpilote-ui/Button'
import { Field } from '@pilote/kpilote-ui/Field'
import { FieldInput } from '@pilote/kpilote-ui/FieldInput'
import { FieldTextarea } from '@pilote/kpilote-ui/FieldTextarea'
import { IconButton } from '@pilote/kpilote-ui/IconButton'
import { Subtitle } from '@pilote/kpilote-ui/Subtitle'
import { clsxm } from '@/lib/clsxm'

// En édition l'identifiant est verrouillé : on ne le valide qu'à la création.
const buildReferentielFormSchema = (mode: 'create' | 'edit') =>
  z.object({
    id: mode === 'create' ? referentielPublicIdSchema : z.string(),
    nom: z.string().trim().min(1, 'Le nom est requis'),
    description: z.string(),
    individus: z.array(
      z.object({
        publicId: individuPublicIdSchema,
        nom: z.string().trim().min(1, "Le nom de l'individu est requis"),
      }),
    ),
  })

export type ReferentielFormValues = z.infer<ReturnType<typeof buildReferentielFormSchema>>

export function ReferentielForm({
  mode,
  initial,
  pending,
  isProd,
  onSubmit,
  onCancel,
}: {
  mode: 'create' | 'edit'
  initial: ReferentielFormValues
  pending: boolean
  isProd: boolean
  onSubmit: (values: ReferentielFormValues) => void
  onCancel: () => void
}) {
  const schema = useMemo(() => buildReferentielFormSchema(mode), [mode])
  const {
    register,
    control,
    setValue,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<ReferentielFormValues>({
    resolver: zodResolver(schema),
    mode: 'onChange',
    defaultValues: initial,
  })
  const { fields, append, remove } = useFieldArray({ control, name: 'individus' })

  return (
    <form onSubmit={(event) => void handleSubmit(onSubmit)(event)}>
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
              placeholder="REF-DEPT"
              className="w-56 py-2 font-mono"
              error={errors.id?.message}
              {...register('id')}
              onChange={(event) =>
                setValue('id', event.target.value.toUpperCase(), {
                  shouldValidate: true,
                  shouldDirty: true,
                })
              }
            />
          )}
        </div>

        <div className="mb-5">
          <FieldInput label="Nom" required error={errors.nom?.message} {...register('nom')} />
        </div>

        <div className="mb-6">
          <FieldTextarea label="Description" rows={2} {...register('description')} />
        </div>

        <div className="border-t border-border pt-5">
          <div className="mb-1 flex items-center justify-between">
            <span className="text-sm font-bold">Individus</span>
            <button
              type="button"
              onClick={() => append({ publicId: '', nom: '' })}
              className="flex items-center gap-1 text-sm font-semibold text-primary"
            >
              <Plus className="size-4" /> Ajouter
            </button>
          </div>
          <Subtitle className="mb-4">
            Un individu ne peut appartenir qu'à un seul référentiel. En ajouter un déjà rattaché
            ailleurs sera refusé (409).
          </Subtitle>
          {fields.map((field, index) => (
            <div
              key={field.id}
              className="mb-2.5 flex items-start gap-2.5 rounded-lg border border-border bg-surface-muted px-3 py-2.5"
            >
              <div className="flex-1">
                <FieldInput
                  label={`Identifiant de l'individu ${index + 1}`}
                  hideLabel
                  placeholder="DEPT-75"
                  className="bg-surface px-2.5 py-2 font-mono"
                  error={errors.individus?.[index]?.publicId?.message}
                  {...register(`individus.${index}.publicId`)}
                  onChange={(event) =>
                    setValue(`individus.${index}.publicId`, event.target.value.toUpperCase(), {
                      shouldValidate: true,
                      shouldDirty: true,
                    })
                  }
                />
              </div>
              <div className="flex-[2]">
                <FieldInput
                  label={`Nom de l'individu ${index + 1}`}
                  hideLabel
                  placeholder="Paris"
                  className="bg-surface px-2.5 py-2"
                  error={errors.individus?.[index]?.nom?.message}
                  {...register(`individus.${index}.nom`)}
                />
              </div>
              <IconButton variant="danger" label="Retirer" onClick={() => remove(index)}>
                <Trash2 />
              </IconButton>
            </div>
          ))}
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
          {pending ? 'Enregistrement…' : isProd ? '🚨 Enregistrer en Prod' : 'Enregistrer'}
        </Button>
      </div>
    </form>
  )
}
