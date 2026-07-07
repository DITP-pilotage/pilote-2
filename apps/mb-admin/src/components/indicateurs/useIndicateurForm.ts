import { zodResolver } from '@hookform/resolvers/zod'
import { useMemo } from 'react'
import { useFieldArray, useForm, useWatch } from 'react-hook-form'
import { z } from 'zod'

import type { IndicateurApiModel, UpsertIndicateurBody } from '@pilote/mb-shared/indicateur'
import {
  configurationIndicateurReferentielSchema,
  indicateurSourceUrlSchema,
  indicateurVisibiliteSchema,
  periodeMiseAJourSchema,
  uniteIndicateurCodeSchema,
} from '@pilote/mb-shared/indicateur'

// Schéma du formulaire (valeurs saisies, toutes en chaînes natives). La
// conversion vers le body PUT — `'' → null`, `jour → number` — est faite par
// `toUpsertBody`. La validation de `id` dépend du mode (create : identifiant
// requis et formaté ; edit : verrouillé, donc non validé).
const buildIndicateurFormSchema = (mode: 'create' | 'edit') =>
  z.object({
    id: mode === 'create' ? z.string().regex(/^IND-\d+$/, 'Format attendu : IND-001') : z.string(),
    nom: z.string().trim().min(1, 'Le nom est requis'),
    visibilite: indicateurVisibiliteSchema,
    unite: z.union([z.literal(''), uniteIndicateurCodeSchema]),
    description: z.string(),
    methodeCalcul: z.string(),
    sourceDonnees: z.string(),
    sourceUrl: z.union([z.literal(''), indicateurSourceUrlSchema]),
    periodeMiseAJour: z.union([z.literal(''), periodeMiseAJourSchema]),
    jourMiseAJour: z
      .string()
      .refine(
        (value) =>
          value === '' || (/^\d+$/.test(value) && Number(value) >= 1 && Number(value) <= 31),
        'Entier entre 1 et 31',
      ),
    referentiels: z.array(configurationIndicateurReferentielSchema),
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

// Regroupe tout le câblage react-hook-form du formulaire indicateur (schéma
// zod mode-dépendant, resolver, tableau de référentiels, watch de la
// visibilité) pour que le composant ne porte que le rendu. On renvoie `form`
// tel quel (le composant appelle `form.register` etc.) plutôt qu'un objet plat,
// pour laisser react-hook-form inférer les types.
export function useIndicateurForm({
  mode,
  initial,
}: {
  mode: 'create' | 'edit'
  initial: IndicateurFormValues
}) {
  const schema = useMemo(() => buildIndicateurFormSchema(mode), [mode])
  const form = useForm<IndicateurFormValues>({
    resolver: zodResolver(schema),
    mode: 'onChange',
    defaultValues: initial,
  })
  const referentiels = useFieldArray({ control: form.control, name: 'referentiels' })
  const visibilite = useWatch({ control: form.control, name: 'visibilite' })

  return { form, referentiels, visibilite }
}
