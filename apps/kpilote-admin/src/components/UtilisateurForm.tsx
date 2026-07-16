import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { Button } from '@pilote/kpilote-ui/Button'
import { FieldInput } from '@/components/ui/FieldInput'
import { useAppConfig } from '@/context/AppConfigContext'
import { clsxm } from '@/lib/clsxm'

const utilisateurFormSchema = z.object({
  email: z.string().email('Email invalide'),
  nom: z.string().trim().min(1, 'Le nom est requis'),
  prenom: z.string().trim().min(1, 'Le prénom est requis'),
  service: z.string().trim().min(1, 'Le service est requis'),
  fonction: z.string().trim().min(1, 'La fonction est requise'),
})

export type UtilisateurFormValues = z.infer<typeof utilisateurFormSchema>

export function UtilisateurForm({
  mode,
  initialValues,
  pending,
  onSubmit,
  onCancel,
}: {
  mode: 'create' | 'update'
  initialValues?: Partial<UtilisateurFormValues>
  pending: boolean
  onSubmit: (values: UtilisateurFormValues) => void
  onCancel: () => void
}) {
  const { isProd } = useAppConfig()
  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<UtilisateurFormValues>({
    resolver: zodResolver(utilisateurFormSchema),
    mode: 'onChange',
    defaultValues: {
      email: initialValues?.email ?? '',
      nom: initialValues?.nom ?? '',
      prenom: initialValues?.prenom ?? '',
      service: initialValues?.service ?? '',
      fonction: initialValues?.fonction ?? '',
    },
  })

  const emailReadOnly = mode === 'update'

  const submitLabel = pending
    ? mode === 'create'
      ? 'Création…'
      : 'Enregistrement…'
    : isProd
      ? mode === 'create'
        ? '🚨 Créer en Prod'
        : '🚨 Enregistrer en Prod'
      : mode === 'create'
        ? "Créer l'utilisateur"
        : 'Enregistrer'

  return (
    <form onSubmit={(event) => void handleSubmit(onSubmit)(event)}>
      <div className="rounded-xl border border-border bg-surface p-6">
        <div className="mb-5">
          <FieldInput
            label="Email"
            required
            type="email"
            placeholder="prenom.nom@example.gouv.fr"
            readOnly={emailReadOnly}
            hint={emailReadOnly ? '(non modifiable)' : undefined}
            error={errors.email?.message}
            {...register('email')}
          />
        </div>

        <div className="mb-5 grid grid-cols-2 gap-4">
          <FieldInput
            label="Prénom"
            required
            placeholder="Jane"
            error={errors.prenom?.message}
            {...register('prenom')}
          />
          <FieldInput
            label="Nom"
            required
            placeholder="Doe"
            error={errors.nom?.message}
            {...register('nom')}
          />
        </div>

        <div className="mb-5">
          <FieldInput
            label="Service"
            required
            placeholder="DITP / SI / …"
            error={errors.service?.message}
            {...register('service')}
          />
        </div>

        <div className="mb-2">
          <FieldInput
            label="Fonction"
            required
            placeholder="Chargée de mission"
            error={errors.fonction?.message}
            {...register('fonction')}
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
          className={clsxm(isProd && 'bg-accent-rouge hover:bg-accent-rouge')}
        >
          {submitLabel}
        </Button>
      </div>
    </form>
  )
}
