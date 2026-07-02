import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { Button } from '@/components/ui/Button'
import { useAppConfig } from '@/context/AppConfigContext'
import { clsxm } from '@/lib/clsxm'

const apiKeyFormSchema = z.object({
  label: z.string().trim().min(1, 'Le label est requis'),
  role: z.enum(['CONTRIBUTOR', 'ADMIN']),
  expiresAt: z.string(),
})

export type ApiKeyFormValues = z.infer<typeof apiKeyFormSchema>

export function ApiKeyForm({
  pending,
  errorMessage,
  onSubmit,
  onCancel,
}: {
  pending: boolean
  errorMessage: string | null
  onSubmit: (values: ApiKeyFormValues) => void
  onCancel: () => void
}) {
  const { isProd } = useAppConfig()
  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<ApiKeyFormValues>({
    resolver: zodResolver(apiKeyFormSchema),
    mode: 'onChange',
    defaultValues: { label: '', role: 'CONTRIBUTOR', expiresAt: '' },
  })

  return (
    <form onSubmit={(event) => void handleSubmit(onSubmit)(event)} className="mx-auto max-w-2xl">
      <div className="rounded-xl border border-border bg-surface p-6">
        <div className="mb-5">
          <label className="mb-1.5 block text-xs font-semibold">
            Label <span className="text-accent">*</span>
          </label>
          <input
            {...register('label')}
            placeholder="Intégration SI-X"
            className="w-full rounded-md border border-border px-3 py-2.5 text-sm focus:border-primary focus:outline-none"
          />
          {errors.label ? <p className="mt-1 text-xs text-accent">{errors.label.message}</p> : null}
        </div>

        <div className="mb-5">
          <label className="mb-1.5 block text-xs font-semibold">Rôle</label>
          <select
            {...register('role')}
            className="w-56 rounded-md border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none"
          >
            <option value="CONTRIBUTOR">CONTRIBUTOR</option>
            <option value="ADMIN">ADMIN</option>
          </select>
        </div>

        <div className="mb-2">
          <label className="mb-1.5 block text-xs font-semibold">Expiration (optionnelle)</label>
          <input
            type="date"
            {...register('expiresAt')}
            className="w-56 rounded-md border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none"
          />
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
          {pending ? 'Création…' : isProd ? '🚨 Créer en Prod' : 'Créer la clé'}
        </Button>
      </div>
    </form>
  )
}
