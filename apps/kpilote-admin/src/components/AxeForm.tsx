import { Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'

import { Button } from '@pilote/kpilote-ui/Button'
import { IconButton } from '@pilote/kpilote-ui/IconButton'
import { Subtitle } from '@pilote/kpilote-ui/Subtitle'
import { clsxm } from '@/lib/clsxm'

export type AxeFormValues = {
  id: string
  nom: string
  description: string
  niveaux: string[]
}

const INPUT =
  'rounded-md border border-border px-3 py-2.5 text-sm focus:border-primary focus:outline-none'

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
  const [values, setValues] = useState<AxeFormValues>(initial)

  const update = (patch: Partial<AxeFormValues>) => setValues((prev) => ({ ...prev, ...patch }))
  const renameNiveau = (index: number, nom: string) =>
    update({ niveaux: values.niveaux.map((niveau, i) => (i === index ? nom : niveau)) })

  const canSubmit =
    values.nom.trim().length > 0 &&
    (mode === 'edit' || /^AXE-[A-Z0-9-]{1,16}$/.test(values.id)) &&
    values.niveaux.length > 0 &&
    values.niveaux.every((niveau) => niveau.trim().length > 0)

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
              placeholder="AXE-OPERATEUR"
              className={`${INPUT} w-64 py-2 font-mono`}
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
            className={`${INPUT} w-full`}
          />
        </div>

        <div className="mb-6">
          <label className="mb-1.5 block text-xs font-semibold">Description</label>
          <textarea
            value={values.description}
            onChange={(event) => update({ description: event.target.value })}
            rows={2}
            className={`${INPUT} w-full`}
          />
        </div>

        <div className="border-t border-border pt-5">
          <div className="mb-1 flex items-center justify-between">
            <span className="text-sm font-bold">Niveaux</span>
            <button
              type="button"
              onClick={() => update({ niveaux: [...values.niveaux, ''] })}
              className="flex items-center gap-1 text-sm font-semibold text-primary"
            >
              <Plus className="size-4" /> Ajouter un niveau
            </button>
          </div>
          <Subtitle className="mb-4">
            Du plus large au plus fin (ex. Famille, puis Type). Un axe plat a un seul niveau. On ne
            peut retirer que le dernier niveau, et seulement s’il ne porte pas de modalités.
          </Subtitle>
          {values.niveaux.map((niveau, index) => (
            <div
              key={index}
              className="mb-2.5 flex items-center gap-2.5 rounded-lg border border-border bg-surface-muted px-3 py-2.5"
            >
              <span className="w-20 text-xs font-semibold text-text-muted">Niveau {index + 1}</span>
              <input
                value={niveau}
                onChange={(event) => renameNiveau(index, event.target.value)}
                aria-label={`Nom du niveau ${index + 1}`}
                placeholder={index === 0 ? 'Famille' : 'Type'}
                className="flex-1 rounded-md border border-border bg-surface px-2.5 py-2 text-sm focus:border-primary focus:outline-none"
              />
              {index === values.niveaux.length - 1 && values.niveaux.length > 1 ? (
                <IconButton
                  variant="danger"
                  label={`Retirer le niveau ${index + 1}`}
                  onClick={() => update({ niveaux: values.niveaux.slice(0, -1) })}
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
