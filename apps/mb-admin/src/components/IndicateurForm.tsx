import { useQuery } from '@tanstack/react-query'
import { Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'

import type { IndicateurApiModel } from '@pilote/mb-shared/indicateur'
import { referentielPublicIdSchema } from '@pilote/mb-shared/publicIds'

import { fetchAllReferentiels } from '@/api/referentiels'
import { Button } from '@/components/ui/Button'
import { clsxm } from '@/lib/clsxm'

type FonctionAgregation = 'SUM' | 'AVG' | 'NONE'
type ReferentielLie = { id: string; fonctionAgregation: FonctionAgregation }

export type IndicateurFormValues = {
  id: string
  nom: string
  visibilite: 'PUBLIC' | 'PRIVE'
  unite: 'POURCENTAGE' | 'ANNEES' | null
  referentiels: ReferentielLie[]
}

const AGREGATION_LABEL: Record<FonctionAgregation, string> = {
  SUM: 'Somme',
  AVG: 'Moyenne',
  NONE: 'Aucune',
}

export function buildInitialValues(indicateur?: IndicateurApiModel): IndicateurFormValues {
  return {
    id: indicateur?.id ?? '',
    nom: indicateur?.nom ?? '',
    visibilite: indicateur?.visibilite ?? 'PUBLIC',
    unite: indicateur?.unite?.code ?? null,
    referentiels: indicateur?.referentiels ?? [],
  }
}

export function IndicateurForm({
  mode,
  initial,
  pending,
  errorMessage,
  isProd,
  onSubmit,
  onCancel,
}: {
  mode: 'create' | 'edit'
  initial: IndicateurFormValues
  pending: boolean
  errorMessage: string | null
  isProd: boolean
  onSubmit: (values: IndicateurFormValues) => void
  onCancel: () => void
}) {
  const [values, setValues] = useState<IndicateurFormValues>(initial)
  const referentielsQuery = useQuery({
    queryKey: ['referentiels', 'all-for-select'],
    queryFn: () => fetchAllReferentiels(),
  })
  const referentielsOptions = referentielsQuery.data ?? []

  const update = (patch: Partial<IndicateurFormValues>) =>
    setValues((prev) => ({ ...prev, ...patch }))
  const updateReferentiel = (index: number, patch: Partial<ReferentielLie>) =>
    setValues((prev) => ({
      ...prev,
      referentiels: prev.referentiels.map((ref, i) => (i === index ? { ...ref, ...patch } : ref)),
    }))
  const addReferentiel = () =>
    update({
      referentiels: [...values.referentiels, { id: '', fonctionAgregation: 'SUM' }],
    })
  const removeReferentiel = (index: number) =>
    update({ referentiels: values.referentiels.filter((_, i) => i !== index) })

  const canSubmit =
    values.nom.trim().length > 0 &&
    values.referentiels.every((ref) => referentielPublicIdSchema.safeParse(ref.id).success)

  return (
    <div className="mx-auto max-w-2xl">
      <div className="rounded-xl border border-border bg-surface p-6">
        {mode === 'edit' ? (
          <div className="mb-5">
            <label className="mb-1.5 block text-xs font-semibold">Identifiant</label>
            <span className="inline-flex items-center gap-2 rounded-md border border-primary/20 bg-surface-tinted px-3 py-2 font-mono text-sm text-primary">
              {values.id}{' '}
              <span className="font-sans text-xs text-text-subtle">🔒 non modifiable</span>
            </span>
          </div>
        ) : (
          <p className="mb-5 text-xs text-text-subtle">
            L'identifiant (<code>IND-…</code>) est généré automatiquement à la création.
          </p>
        )}

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

        <div className="mb-6 flex gap-4">
          <div className="flex-1">
            <label className="mb-1.5 block text-xs font-semibold">Visibilité</label>
            <div className="flex overflow-hidden rounded-md border border-border text-sm">
              {(['PUBLIC', 'PRIVE'] as const).map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => update({ visibilite: option })}
                  className={clsxm(
                    'flex-1 py-2',
                    values.visibilite === option
                      ? 'bg-primary font-semibold text-white'
                      : 'text-text-muted',
                  )}
                >
                  {option === 'PUBLIC' ? 'Public' : 'Privé'}
                </button>
              ))}
            </div>
          </div>
          <div className="flex-1">
            <label className="mb-1.5 block text-xs font-semibold">Unité</label>
            <select
              value={values.unite ?? ''}
              onChange={(event) =>
                update({
                  unite:
                    event.target.value === ''
                      ? null
                      : (event.target.value as 'POURCENTAGE' | 'ANNEES'),
                })
              }
              className="w-full rounded-md border border-border px-3 py-2.5 text-sm focus:border-primary focus:outline-none"
            >
              <option value="">Aucune</option>
              <option value="POURCENTAGE">Pourcentage</option>
              <option value="ANNEES">Années</option>
            </select>
          </div>
        </div>

        <div className="border-t border-border pt-5">
          <div className="mb-1 flex items-center justify-between">
            <span className="text-sm font-bold">Référentiels liés</span>
            <button
              type="button"
              onClick={addReferentiel}
              className="flex items-center gap-1 text-sm font-semibold text-primary"
            >
              <Plus className="size-4" /> Ajouter
            </button>
          </div>
          <p className="mb-4 text-xs text-text-subtle">
            ⚠ Cette liste remplace <b>intégralement</b> l'existant (replace-all). Retirer une ligne
            supprime le lien.
          </p>
          {values.referentiels.map((ref, index) => (
            <div
              key={index}
              className="mb-2.5 flex items-center gap-2.5 rounded-lg border border-border bg-surface-muted px-3 py-2.5"
            >
              <select
                value={ref.id}
                onChange={(event) => updateReferentiel(index, { id: event.target.value })}
                className="flex-[2] rounded-md border border-border bg-surface px-2.5 py-2 text-sm focus:border-primary focus:outline-none"
              >
                <option value="" disabled>
                  Choisir un référentiel…
                </option>
                {referentielsOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.id} · {option.nom}
                  </option>
                ))}
              </select>
              <select
                value={ref.fonctionAgregation}
                onChange={(event) =>
                  updateReferentiel(index, {
                    fonctionAgregation: event.target.value as FonctionAgregation,
                  })
                }
                className="flex-1 rounded-md border border-border bg-surface px-2.5 py-2 text-sm focus:border-primary focus:outline-none"
              >
                {(['SUM', 'AVG', 'NONE'] as const).map((option) => (
                  <option key={option} value={option}>
                    {AGREGATION_LABEL[option]}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => removeReferentiel(index)}
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
          className={isProd ? 'bg-accent hover:bg-accent' : undefined}
        >
          {pending ? 'Enregistrement…' : isProd ? '🚨 Enregistrer en Prod' : 'Enregistrer'}
        </Button>
      </div>
    </div>
  )
}
