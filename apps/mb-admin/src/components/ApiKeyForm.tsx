import { useState } from 'react'

import { Button } from '@/components/ui/Button'
import { clsxm } from '@/lib/clsxm'

export type ApiKeyFormValues = {
  label: string
  role: 'CONTRIBUTOR' | 'ADMIN'
  expiresAt: string
}

export function ApiKeyForm({
  pending,
  errorMessage,
  isProd,
  onSubmit,
  onCancel,
}: {
  pending: boolean
  errorMessage: string | null
  isProd: boolean
  onSubmit: (values: ApiKeyFormValues) => void
  onCancel: () => void
}) {
  const [values, setValues] = useState<ApiKeyFormValues>({
    label: '',
    role: 'CONTRIBUTOR',
    expiresAt: '',
  })

  const update = (patch: Partial<ApiKeyFormValues>) => setValues((prev) => ({ ...prev, ...patch }))

  const canSubmit = values.label.trim().length > 0

  return (
    <div className="mx-auto max-w-2xl">
      <div className="rounded-xl border border-border bg-surface p-6">
        <div className="mb-5">
          <label className="mb-1.5 block text-xs font-semibold">
            Label <span className="text-accent">*</span>
          </label>
          <input
            value={values.label}
            onChange={(event) => update({ label: event.target.value })}
            placeholder="Intégration SI-X"
            className="w-full rounded-md border border-border px-3 py-2.5 text-sm focus:border-primary focus:outline-none"
          />
        </div>

        <div className="mb-5">
          <label className="mb-1.5 block text-xs font-semibold">Rôle</label>
          <select
            value={values.role}
            onChange={(event) => update({ role: event.target.value as ApiKeyFormValues['role'] })}
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
            value={values.expiresAt}
            onChange={(event) => update({ expiresAt: event.target.value })}
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
          type="button"
          disabled={!canSubmit || pending}
          onClick={() => onSubmit(values)}
          className={clsxm(isProd && 'bg-accent hover:bg-accent')}
        >
          {pending ? 'Création…' : isProd ? '🚨 Créer en Prod' : 'Créer la clé'}
        </Button>
      </div>
    </div>
  )
}
