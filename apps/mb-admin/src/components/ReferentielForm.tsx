import { Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'

import { Button } from '@/components/ui/Button'
import { clsxm } from '@/lib/clsxm'

type IndividuItem = { publicId: string; nom: string }

export type ReferentielFormValues = {
  id: string
  nom: string
  description: string
  individus: IndividuItem[]
}

export function ReferentielForm({
  mode,
  initial,
  pending,
  errorMessage,
  isProd,
  onSubmit,
  onCancel,
}: {
  mode: 'create' | 'edit'
  initial: ReferentielFormValues
  pending: boolean
  errorMessage: string | null
  isProd: boolean
  onSubmit: (values: ReferentielFormValues) => void
  onCancel: () => void
}) {
  const [values, setValues] = useState<ReferentielFormValues>(initial)

  const update = (patch: Partial<ReferentielFormValues>) =>
    setValues((prev) => ({ ...prev, ...patch }))
  const updateIndividu = (index: number, patch: Partial<IndividuItem>) =>
    setValues((prev) => ({
      ...prev,
      individus: prev.individus.map((item, i) => (i === index ? { ...item, ...patch } : item)),
    }))
  const addIndividu = () => update({ individus: [...values.individus, { publicId: '', nom: '' }] })
  const removeIndividu = (index: number) =>
    update({ individus: values.individus.filter((_, i) => i !== index) })

  const canSubmit =
    values.nom.trim().length > 0 &&
    (mode === 'edit' || /^REF-[A-Z0-9-]{1,16}$/.test(values.id)) &&
    values.individus.every(
      (item) => /^[A-Z][A-Z0-9-]{0,19}$/.test(item.publicId) && item.nom.trim().length > 0,
    )

  return (
    <div className="mx-auto max-w-2xl">
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
              placeholder="REF-DEPT"
              className="w-56 rounded-md border border-border px-3 py-2 font-mono text-sm focus:border-primary focus:outline-none"
            />
          )}
        </div>

        <div className="mb-5">
          <label className="mb-1.5 block text-xs font-semibold">
            Nom <span className="text-accent">*</span>
          </label>
          <input
            value={values.nom}
            onChange={(event) => update({ nom: event.target.value })}
            className="w-full rounded-md border border-border px-3 py-2.5 text-sm focus:border-primary focus:outline-none"
          />
        </div>

        <div className="mb-6">
          <label className="mb-1.5 block text-xs font-semibold">Description</label>
          <textarea
            value={values.description}
            onChange={(event) => update({ description: event.target.value })}
            rows={2}
            className="w-full rounded-md border border-border px-3 py-2.5 text-sm focus:border-primary focus:outline-none"
          />
        </div>

        <div className="border-t border-border pt-5">
          <div className="mb-1 flex items-center justify-between">
            <span className="text-sm font-bold">Individus</span>
            <button
              type="button"
              onClick={addIndividu}
              className="flex items-center gap-1 text-sm font-semibold text-primary"
            >
              <Plus className="size-4" /> Ajouter
            </button>
          </div>
          <p className="mb-4 text-xs text-text-subtle">
            Un individu ne peut appartenir qu'à un seul référentiel. En ajouter un déjà rattaché
            ailleurs sera refusé (409).
          </p>
          {values.individus.map((item, index) => (
            <div
              key={index}
              className="mb-2.5 flex items-center gap-2.5 rounded-lg border border-border bg-surface-muted px-3 py-2.5"
            >
              <input
                value={item.publicId}
                onChange={(event) =>
                  updateIndividu(index, { publicId: event.target.value.toUpperCase() })
                }
                placeholder="DEPT-75"
                className="flex-1 rounded-md border border-border bg-surface px-2.5 py-2 font-mono text-sm focus:border-primary focus:outline-none"
              />
              <input
                value={item.nom}
                onChange={(event) => updateIndividu(index, { nom: event.target.value })}
                placeholder="Paris"
                className="flex-[2] rounded-md border border-border bg-surface px-2.5 py-2 text-sm focus:border-primary focus:outline-none"
              />
              <button
                type="button"
                onClick={() => removeIndividu(index)}
                className="text-accent"
                aria-label="Retirer"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
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
          type="button"
          disabled={!canSubmit || pending}
          onClick={() => onSubmit(values)}
          className={clsxm(isProd && 'bg-accent hover:bg-accent')}
        >
          {pending ? 'Enregistrement…' : isProd ? '🚨 Enregistrer en Prod' : 'Enregistrer'}
        </Button>
      </div>
    </div>
  )
}
