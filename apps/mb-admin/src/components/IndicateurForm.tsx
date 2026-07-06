import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery } from '@tanstack/react-query'
import { Plus, Trash2 } from 'lucide-react'
import { useMemo } from 'react'
import { useFieldArray, useForm, useWatch } from 'react-hook-form'
import { z } from 'zod'

import type { IndicateurApiModel, UpsertIndicateurBody } from '@pilote/mb-shared/indicateur'
import { PERIODES_MISE_A_JOUR, periodeMiseAJourSchema } from '@pilote/mb-shared/indicateur'

import { fetchAllReferentiels } from '@/api/referentiels'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useAppConfig } from '@/context/AppConfigContext'
import { clsxm } from '@/lib/clsxm'

type FonctionAgregation = 'SUM' | 'AVG' | 'NONE'

const AGREGATION_LABEL: Record<FonctionAgregation, string> = {
  SUM: 'Somme',
  AVG: 'Moyenne',
  NONE: 'Aucune',
}

const PERIODE_MISE_A_JOUR_LABEL: Record<(typeof PERIODES_MISE_A_JOUR)[number], string> = {
  QUOTIDIENNE: 'Quotidienne',
  HEBDOMADAIRE: 'Hebdomadaire',
  BIMENSUELLE: 'Bimensuelle',
  MENSUELLE: 'Mensuelle',
  TRIMESTRIELLE: 'Trimestrielle',
  SEMESTRIELLE: 'Semestrielle',
  ANNUELLE: 'Annuelle',
  AUCUNE: 'Aucune',
}

const isValidHttpUrl = (value: string): boolean => {
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

const referentielLieSchema = z.object({
  id: z.string().regex(/^REF-[A-Z0-9-]{1,16}$/, 'Référentiel invalide'),
  fonctionAgregation: z.enum(['SUM', 'AVG', 'NONE']),
})

// Schéma du formulaire (valeurs saisies, toutes en chaînes natives). La
// conversion vers le body PUT — `'' → null`, `jour → number` — est faite par
// `toUpsertBody`. La validation de `id` dépend du mode (create : identifiant
// requis et formaté ; edit : verrouillé, donc non validé).
const buildIndicateurFormSchema = (mode: 'create' | 'edit') =>
  z.object({
    id: mode === 'create' ? z.string().regex(/^IND-\d+$/, 'Format attendu : IND-001') : z.string(),
    nom: z.string().trim().min(1, 'Le nom est requis'),
    visibilite: z.enum(['PUBLIC', 'PRIVE']),
    unite: z.union([z.literal(''), z.enum(['POURCENTAGE', 'ANNEES'])]),
    description: z.string(),
    methodeCalcul: z.string(),
    sourceDonnees: z.string(),
    sourceUrl: z
      .string()
      .refine(
        (value) => value.trim() === '' || isValidHttpUrl(value.trim()),
        'URL http(s) invalide',
      ),
    periodeMiseAJour: z.union([z.literal(''), periodeMiseAJourSchema]),
    jourMiseAJour: z
      .string()
      .refine(
        (value) =>
          value === '' || (/^\d+$/.test(value) && Number(value) >= 1 && Number(value) <= 31),
        'Entier entre 1 et 31',
      ),
    referentiels: z.array(referentielLieSchema),
  })

export type IndicateurFormValues = z.infer<ReturnType<typeof buildIndicateurFormSchema>>

export function buildInitialValues(indicateur?: IndicateurApiModel): IndicateurFormValues {
  return {
    id: indicateur?.id ?? '',
    nom: indicateur?.nom ?? '',
    visibilite: indicateur?.visibilite ?? 'PUBLIC',
    unite: indicateur?.unite?.code ?? '',
    description: indicateur?.description ?? '',
    methodeCalcul: indicateur?.methodeCalcul ?? '',
    sourceDonnees: indicateur?.sourceDonnees ?? '',
    sourceUrl: indicateur?.sourceUrl ?? '',
    periodeMiseAJour: indicateur?.periodeMiseAJour ?? '',
    jourMiseAJour: indicateur?.jourMiseAJour != null ? String(indicateur.jourMiseAJour) : '',
    referentiels: indicateur?.referentiels ?? [],
  }
}

const emptyToNull = (value: string): string | null => {
  const trimmed = value.trim()
  return trimmed === '' ? null : trimmed
}

// Mappe les valeurs du formulaire vers le body PUT. Les 6 métadonnées sont
// toujours envoyées (chaîne vide → null = « effacer ») : ce que montre le
// formulaire est ce qui est persisté.
export function toUpsertBody(values: IndicateurFormValues): UpsertIndicateurBody {
  return {
    nom: values.nom,
    visibilite: values.visibilite,
    unite: values.unite === '' ? null : values.unite,
    description: emptyToNull(values.description),
    methodeCalcul: emptyToNull(values.methodeCalcul),
    sourceDonnees: emptyToNull(values.sourceDonnees),
    sourceUrl: emptyToNull(values.sourceUrl),
    periodeMiseAJour: values.periodeMiseAJour === '' ? null : values.periodeMiseAJour,
    jourMiseAJour: values.jourMiseAJour === '' ? null : Number(values.jourMiseAJour),
    referentiels: values.referentiels,
  }
}

export function IndicateurForm({
  mode,
  initial,
  pending,
  errorMessage,
  onSubmit,
  onCancel,
}: {
  mode: 'create' | 'edit'
  initial: IndicateurFormValues
  pending: boolean
  errorMessage: string | null
  onSubmit: (values: IndicateurFormValues) => void
  onCancel: () => void
}) {
  const { isProd } = useAppConfig()
  const schema = useMemo(() => buildIndicateurFormSchema(mode), [mode])
  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors, isValid },
  } = useForm<IndicateurFormValues>({
    resolver: zodResolver(schema),
    mode: 'onChange',
    defaultValues: initial,
  })
  const { fields, append, remove } = useFieldArray({ control, name: 'referentiels' })

  const referentielsQuery = useQuery({
    queryKey: ['referentiels', 'all-for-select'],
    queryFn: () => fetchAllReferentiels(),
  })
  const referentielsOptions = referentielsQuery.data ?? []

  const visibilite = useWatch({ control, name: 'visibilite' })

  return (
    <form onSubmit={(event) => void handleSubmit(onSubmit)(event)} className="mx-auto max-w-2xl">
      <div className="rounded-xl border border-border bg-surface p-6">
        <div className="mb-5">
          <label className="mb-1.5 block text-xs font-semibold">Identifiant</label>
          {mode === 'edit' ? (
            <span className="inline-flex items-center gap-2 rounded-md border border-primary/20 bg-surface-tinted px-3 py-2 font-mono text-sm text-primary">
              {initial.id}{' '}
              <span className="font-sans text-xs text-text-subtle">🔒 non modifiable</span>
            </span>
          ) : (
            <>
              <input
                placeholder="IND-001"
                className="w-48 rounded-md border border-border px-3 py-2 font-mono text-sm focus:border-primary focus:outline-none"
                {...register('id')}
                onChange={(event) =>
                  setValue('id', event.target.value.toUpperCase(), {
                    shouldValidate: true,
                    shouldDirty: true,
                  })
                }
              />
              {errors.id ? <p className="mt-1 text-xs text-accent">{errors.id.message}</p> : null}
            </>
          )}
        </div>

        <div className="mb-5">
          <Input label="Nom" required error={errors.nom?.message} {...register('nom')} />
        </div>

        <div className="mb-6 flex gap-4">
          <div className="flex-1">
            <label className="mb-1.5 block text-xs font-semibold">Visibilité</label>
            <div className="flex overflow-hidden rounded-md border border-border text-sm">
              {(['PUBLIC', 'PRIVE'] as const).map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setValue('visibilite', option, { shouldValidate: true })}
                  className={clsxm(
                    'flex-1 py-2',
                    visibilite === option
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
              className="w-full rounded-md border border-border px-3 py-2.5 text-sm focus:border-primary focus:outline-none"
              {...register('unite')}
            >
              <option value="">Aucune</option>
              <option value="POURCENTAGE">Pourcentage</option>
              <option value="ANNEES">Années</option>
            </select>
          </div>
        </div>

        <div className="mb-6 border-t border-border pt-5">
          <span className="mb-4 block text-sm font-bold">Métadonnées</span>

          <div className="mb-5">
            <label className="mb-1.5 block text-xs font-semibold">Description</label>
            <textarea
              rows={3}
              className="w-full resize-y rounded-md border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none"
              {...register('description')}
            />
          </div>

          <div className="mb-5">
            <label className="mb-1.5 block text-xs font-semibold">Méthode de calcul</label>
            <textarea
              rows={3}
              className="w-full resize-y rounded-md border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none"
              {...register('methodeCalcul')}
            />
          </div>

          <div className="mb-5 flex gap-4">
            <div className="flex-1">
              <Input
                label="Source des données"
                error={errors.sourceDonnees?.message}
                {...register('sourceDonnees')}
              />
            </div>
            <div className="flex-1">
              <Input
                label="URL de la source"
                type="url"
                placeholder="https://…"
                error={errors.sourceUrl?.message}
                {...register('sourceUrl')}
              />
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex-1">
              <label className="mb-1.5 block text-xs font-semibold">Période de mise à jour</label>
              <select
                className="w-full rounded-md border border-border px-3 py-2.5 text-sm focus:border-primary focus:outline-none"
                {...register('periodeMiseAJour')}
              >
                <option value="">Non renseignée</option>
                {PERIODES_MISE_A_JOUR.map((periode) => (
                  <option key={periode} value={periode}>
                    {PERIODE_MISE_A_JOUR_LABEL[periode]}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <Input
                label="Jour de mise à jour"
                type="number"
                min={1}
                max={31}
                placeholder="1–31"
                error={errors.jourMiseAJour?.message}
                {...register('jourMiseAJour')}
              />
            </div>
          </div>
        </div>

        <div className="border-t border-border pt-5">
          <div className="mb-1 flex items-center justify-between">
            <span className="text-sm font-bold">Référentiels liés</span>
            <button
              type="button"
              onClick={() => append({ id: '', fonctionAgregation: 'SUM' })}
              className="flex items-center gap-1 text-sm font-semibold text-primary"
            >
              <Plus className="size-4" /> Ajouter
            </button>
          </div>
          <p className="mb-4 text-xs text-text-subtle">
            ⚠ Cette liste remplace <b>intégralement</b> l'existant (replace-all). Retirer une ligne
            supprime le lien.
          </p>
          {fields.map((field, index) => (
            <div
              key={field.id}
              className="mb-2.5 flex items-center gap-2.5 rounded-lg border border-border bg-surface-muted px-3 py-2.5"
            >
              <select
                className="flex-[2] rounded-md border border-border bg-surface px-2.5 py-2 text-sm focus:border-primary focus:outline-none"
                {...register(`referentiels.${index}.id`)}
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
                className="flex-1 rounded-md border border-border bg-surface px-2.5 py-2 text-sm focus:border-primary focus:outline-none"
                {...register(`referentiels.${index}.fonctionAgregation`)}
              >
                {(['SUM', 'AVG', 'NONE'] as const).map((option) => (
                  <option key={option} value={option}>
                    {AGREGATION_LABEL[option]}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => remove(index)}
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
          type="submit"
          disabled={!isValid || pending}
          className={isProd ? 'bg-accent hover:bg-accent' : undefined}
        >
          {pending ? 'Enregistrement…' : isProd ? '🚨 Enregistrer en Prod' : 'Enregistrer'}
        </Button>
      </div>
    </form>
  )
}
