import { useState } from 'react'

import { Button } from '@pilote/kpilote-ui/Button'
import { clsxm } from '@/lib/clsxm'

export type DimensionFormValues = {
  id: string
  nom: string
  description: string
}

export function DimensionForm({
  mode,
  initial,
  pending,
  isProd,
  onSubmit,
  onCancel,
}: {
  mode: 'create' | 'edit'
  initial: DimensionFormValues
  pending: boolean
  isProd: boolean
  onSubmit: (values: DimensionFormValues) => void
  onCancel: () => void
}) {
  const [values, setValues] = useState<DimensionFormValues>(initial)

  const update = (patch: Partial<DimensionFormValues>) =>
    setValues((prev) => ({ ...prev, ...patch }))

  const canSubmit =
    values.nom.trim().length > 0 && (mode === 'edit' || /^DIM-[A-Z0-9-]{1,16}$/.test(values.id))

  return (
    <div>
      <div className="rounded-xl border border-border bg-surface p-6">
        <div className="mb-5">
          <label className="mb-1.5 block text-xs font-semibold">Identifiant</label>
          {mode === 'edit' ? (
            <span className="inline-flex items-center gap-2 rounded-md border border-primary/20 bg-surface-tinted px-3 py-2 font-mono text-sm text-primary">
              {values.id}{' '}
              <span className="font-sans text-xs text-text-subtle">🔒 non modifiable</span>
            </span>
          ) : (
            <input
              value={values.id}
              onChange={(event) => update({ id: event.target.value.toUpperCase() })}
              placeholder="DIM-OPERATEUR"
              className="w-56 rounded-md border border-border px-3 py-2 font-mono text-sm focus:border-primary focus:outline-none"
            />
          )}
        </div>

        <div className="mb-5">
          <label className="mb-1.5 block text-xs font-semibold">
            Nom <span className="text-red-marianne">*</span>
          </label>
          <input
            value={values.nom}
            onChange={(event) => update({ nom: event.target.value })}
            placeholder="Opérateur"
            className="w-full rounded-md border border-border px-3 py-2.5 text-sm focus:border-primary focus:outline-none"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-semibold">Description</label>
          <textarea
            value={values.description}
            onChange={(event) => update({ description: event.target.value })}
            rows={2}
            className="w-full rounded-md border border-border px-3 py-2.5 text-sm focus:border-primary focus:outline-none"
          />
        </div>
      </div>

      <div className="mt-5 flex justify-end gap-3">
        <Button variant="secondary" type="button" onClick={onCancel}>
          Annuler
        </Button>
        <Button
          type="button"
          disabled={!canSubmit || pending}
          onClick={() => onSubmit(values)}
          className={clsxm(isProd && 'bg-red-marianne hover:bg-red-marianne')}
        >
          {pending ? 'Enregistrement…' : isProd ? '🚨 Enregistrer en Prod' : 'Enregistrer'}
        </Button>
      </div>
    </div>
  )
}
