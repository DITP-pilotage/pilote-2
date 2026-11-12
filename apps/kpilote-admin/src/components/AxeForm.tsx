import { zodResolver } from '@hookform/resolvers/zod'
import { Plus, Trash2 } from 'lucide-react'
import { useMemo } from 'react'
import { useFieldArray, useForm } from 'react-hook-form'
import { z } from 'zod'

import { axePublicIdSchema } from '@pilote/kpilote-shared/axe'

import { Button } from '@pilote/kpilote-ui/Button'
import { Field } from '@pilote/kpilote-ui/Field'
import { FieldInput } from '@pilote/kpilote-ui/FieldInput'
import { FieldTextarea } from '@pilote/kpilote-ui/FieldTextarea'
import { IconButton } from '@pilote/kpilote-ui/IconButton'
import { Subtitle } from '@pilote/kpilote-ui/Subtitle'
import { clsxm } from '@/lib/clsxm'

// En édition l'identifiant est verrouillé : on ne le valide qu'à la création.
const buildAxeFormSchema = (mode: 'create' | 'edit') =>
  z.object({
    id: mode === 'create' ? axePublicIdSchema : z.string(),
    nom: z.string().trim().min(1, 'Le nom est requis'),
    description: z.string(),
    niveaux: z
      .array(z.object({ nom: z.string().trim().min(1, 'Le nom du niveau est requis') }))
      .min(1, 'Au moins un niveau est requis'),
  })

export type AxeFormValues = z.infer<ReturnType<typeof buildAxeFormSchema>>

export function AxeForm({
  mode,
  initial,
  pending,
  isProd,
  onSubmit,
  onCancel,
}: {
  mode: 'create' | 'edit'
  initial: AxeFormValues
  pending: boolean
  isProd: boolean
  onSubmit: (values: AxeFormValues) => void
  onCancel: () => void
}) {
  const schema = useMemo(() => buildAxeFormSchema(mode), [mode])
  const {
    register,
    control,
    setValue,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<AxeFormValues>({
    resolver: zodResolver(schema),
    mode: 'onChange',
    defaultValues: initial,
  })
  const { fields, append, remove } = useFieldArray({ control, name: 'niveaux' })

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
              placeholder="AXE-OPERATEUR"
              className="w-64 py-2 font-mono"
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
          <FieldInput
            label="Nom"
            required
            placeholder="Opérateur"
            error={errors.nom?.message}
            {...register('nom')}
          />
        </div>

        <div className="mb-6">
          <FieldTextarea label="Description" rows={2} {...register('description')} />
        </div>

        <div className="border-t border-border pt-5">
          <div className="mb-1 flex items-center justify-between">
            <span className="text-sm font-bold">Niveaux</span>
            <button
              type="button"
              onClick={() => append({ nom: '' })}
              className="flex items-center gap-1 text-sm font-semibold text-primary"
            >
              <Plus className="size-4" /> Ajouter un niveau
            </button>
          </div>
          <Subtitle className="mb-4">
            Du plus large au plus fin (ex. Famille, puis Type). Un axe plat a un seul niveau. On ne
            peut retirer que le dernier niveau, et seulement s’il ne porte pas de modalités.
          </Subtitle>
          {fields.map((field, index) => (
            <div
              key={field.id}
              className="mb-2.5 flex items-start gap-2.5 rounded-lg border border-border bg-surface-muted px-3 py-2.5"
            >
              <span className="w-20 pt-2 text-xs font-semibold text-text-muted">
                Niveau {index + 1}
              </span>
              <div className="flex-1">
                <FieldInput
                  label={`Nom du niveau ${index + 1}`}
                  hideLabel
                  placeholder={index === 0 ? 'Famille' : 'Type'}
                  className="bg-surface px-2.5 py-2"
                  error={errors.niveaux?.[index]?.nom?.message}
                  {...register(`niveaux.${index}.nom`)}
                />
              </div>
              {index === fields.length - 1 && fields.length > 1 ? (
                <IconButton
                  variant="danger"
                  label={`Retirer le niveau ${index + 1}`}
                  onClick={() => remove(index)}
                >
                  <Trash2 />
                </IconButton>
              ) : (
                <span className="size-9" />
              )}
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
