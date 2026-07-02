import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { Button } from '@/components/ui/Button'
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

export type UtilisateurFormProps = {
  mode: 'create' | 'update'
  initialValues?: Partial<UtilisateurFormValues>
  pending: boolean
  errorMessage: string | null
  onSubmit: (values: UtilisateurFormValues) => void
  onCancel: () => void
}

export function UtilisateurForm({
  mode,
  initialValues,
  pending,
  errorMessage,
  onSubmit,
  onCancel,
}: UtilisateurFormProps) {
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
    <form onSubmit={(event) => void handleSubmit(onSubmit)(event)} className="mx-auto max-w-2xl">
      <div className="rounded-xl border border-border bg-surface p-6">
        <div className="mb-5">
          <label className="mb-1.5 block text-xs font-semibold">
            Email <span className="text-accent">*</span>
            {emailReadOnly ? (
              <span className="ml-2 text-xs font-normal text-text-muted">(non modifiable)</span>
            ) : null}
          </label>
          <input
            type="email"
            {...register('email')}
            readOnly={emailReadOnly}
            placeholder="prenom.nom@example.gouv.fr"
            className={clsxm(
              'w-full rounded-md border border-border px-3 py-2.5 text-sm focus:border-primary focus:outline-none',
              emailReadOnly && 'bg-surface-muted text-text-muted',
            )}
          />
          {errors.email ? <p className="mt-1 text-xs text-accent">{errors.email.message}</p> : null}
        </div>

        <div className="mb-5 grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1.5 block text-xs font-semibold">
              Prénom <span className="text-accent">*</span>
            </label>
            <input
              {...register('prenom')}
              placeholder="Jane"
              className="w-full rounded-md border border-border px-3 py-2.5 text-sm focus:border-primary focus:outline-none"
            />
            {errors.prenom ? (
              <p className="mt-1 text-xs text-accent">{errors.prenom.message}</p>
            ) : null}
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold">
              Nom <span className="text-accent">*</span>
            </label>
            <input
              {...register('nom')}
              placeholder="Doe"
              className="w-full rounded-md border border-border px-3 py-2.5 text-sm focus:border-primary focus:outline-none"
            />
            {errors.nom ? <p className="mt-1 text-xs text-accent">{errors.nom.message}</p> : null}
          </div>
        </div>

        <div className="mb-5">
          <label className="mb-1.5 block text-xs font-semibold">
            Service <span className="text-accent">*</span>
          </label>
          <input
            {...register('service')}
            placeholder="DITP / SI / …"
            className="w-full rounded-md border border-border px-3 py-2.5 text-sm focus:border-primary focus:outline-none"
          />
          {errors.service ? (
            <p className="mt-1 text-xs text-accent">{errors.service.message}</p>
          ) : null}
        </div>

        <div className="mb-2">
          <label className="mb-1.5 block text-xs font-semibold">
            Fonction <span className="text-accent">*</span>
          </label>
          <input
            {...register('fonction')}
            placeholder="Chargée de mission"
            className="w-full rounded-md border border-border px-3 py-2.5 text-sm focus:border-primary focus:outline-none"
          />
          {errors.fonction ? (
            <p className="mt-1 text-xs text-accent">{errors.fonction.message}</p>
          ) : null}
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
          disabled={!isValid || pending}
          className={clsxm(isProd && 'bg-accent hover:bg-accent')}
        >
          {submitLabel}
        </Button>
      </div>
    </form>
  )
}
