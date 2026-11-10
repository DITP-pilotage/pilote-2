import {
  fonctionAgregationSchema,
  type ConfigurationIndicateurDimension,
} from '@pilote/kpilote-shared/indicateur'
import { useSuspenseQuery } from '@tanstack/react-query'
import { useWatch, type Control } from 'react-hook-form'

import {
  FONCTION_MARGINALE_LABEL,
  resoudreDimensionsIndicateur,
  validerDimensionsIndicateur,
} from '@/components/indicateurs/dimensionsIndicateur'
import { useIndicateurFormContext } from '@/components/indicateurs/indicateurFormContext'
import { type IndicateurFormValues } from '@/components/indicateurs/indicateurFormSchema'
import { dimensionsAllQueryOptions } from '@/queries/dimensions'
import { referentielsAllQueryOptions } from '@/queries/referentiels'
import { FieldSelect } from '@pilote/kpilote-ui/FieldSelect'
import { Subtitle } from '@pilote/kpilote-ui/Subtitle'

// Configuration des dimensions telle qu'elle sera envoyée : vide tant que les
// niveaux couvrent moins de deux dimensions (indicateur mono-dimension).
export const useDimensionsIndicateur = ({
  control,
  dimensionsConservees,
}: {
  control: Control<IndicateurFormValues>
  dimensionsConservees: ReadonlyArray<string>
}) => {
  const niveaux = useWatch({ control, name: 'referentiels' })
  const configurations = useWatch({ control, name: 'dimensions' })
  const { data: referentiels } = useSuspenseQuery(referentielsAllQueryOptions())
  const dimensionParReferentiel = new Map(
    referentiels.map((referentiel) => [referentiel.id, referentiel.dimension]),
  )
  const resolues = resoudreDimensionsIndicateur({
    niveaux: niveaux ?? [],
    dimensionParReferentiel,
    configurations: configurations ?? [],
    dimensionsConservees,
  })
  return { resolues, erreur: validerDimensionsIndicateur(resolues), dimensionParReferentiel }
}

export function AdminDimensions({
  dimensionsConservees,
}: {
  dimensionsConservees: ReadonlyArray<string>
}) {
  const form = useIndicateurFormContext()
  const { resolues, erreur, dimensionParReferentiel } = useDimensionsIndicateur({
    control: form.control,
    dimensionsConservees,
  })
  const niveaux = useWatch({ control: form.control, name: 'referentiels' }) ?? []
  const { data: dimensions } = useSuspenseQuery(dimensionsAllQueryOptions())
  const { data: referentiels } = useSuspenseQuery(referentielsAllQueryOptions())

  // Mono-dimension : section absente, formulaire historique inchangé.
  if (resolues.length === 0) return null

  const nomDimension = new Map(dimensions.map((dimension) => [dimension.id, dimension.nom]))
  const nomReferentiel = new Map(
    referentiels.map((referentiel) => [referentiel.id, referentiel.nom]),
  )
  // Positions proposées : 0..n-1, plus les ordres déjà persistés hors de cette plage.
  const ordres = [
    ...new Set([
      ...resolues.map((_, index) => index),
      ...resolues.map((configuration) => configuration.ordre),
    ]),
  ].sort((a, b) => a - b)

  // On réécrit la liste résolue complète : les défauts affichés deviennent des
  // saisies, et les configurations de dimensions retirées disparaissent.
  const modifier = (id: string, patch: Partial<ConfigurationIndicateurDimension>) =>
    form.setValue(
      'dimensions',
      resolues.map((configuration) =>
        configuration.id === id ? { ...configuration, ...patch } : configuration,
      ),
      { shouldDirty: true },
    )

  return (
    <div className="my-5 border-t border-border pt-5">
      <span className="mb-1 block text-sm font-bold">Dimensions</span>
      <Subtitle className="mb-4">
        Indicateur croisé : les niveaux couvrent {resolues.length} dimensions. L'ordre fixe la
        remontée (0 = agrégée en dernier) ; la fonction de la marginale calcule « tous » sur la
        dimension. Ajouter ou retirer une dimension est refusé (409) si l'indicateur porte déjà des
        valeurs ou des objectifs.
      </Subtitle>

      <ul className="space-y-2">
        {resolues.map((configuration) => {
          const niveauxDeLaDimension = niveaux.filter(
            (niveau) => dimensionParReferentiel.get(niveau.id) === configuration.id,
          )
          return (
            <li
              key={configuration.id}
              className="flex items-center gap-2.5 rounded-lg border border-border bg-surface-muted px-3 py-2"
            >
              <span className="min-w-0 flex-[2]">
                <span className="block text-sm text-text">
                  {nomDimension.get(configuration.id) ?? configuration.id}{' '}
                  <span className="font-mono text-xs text-text-muted">{configuration.id}</span>
                </span>
                <span className="block truncate text-xs text-text-muted">
                  {niveauxDeLaDimension.length > 0
                    ? niveauxDeLaDimension
                        .map((niveau) => nomReferentiel.get(niveau.id) ?? niveau.id)
                        .join(', ')
                    : 'Aucun niveau dans ce formulaire : niveaux existants conservés'}
                </span>
              </span>
              <div className="w-28">
                <FieldSelect
                  label={`Ordre de ${configuration.id}`}
                  hideLabel
                  value={String(configuration.ordre)}
                  onValueChange={(ordre) => modifier(configuration.id, { ordre: Number(ordre) })}
                  options={ordres.map((ordre) => ({
                    value: String(ordre),
                    label: `Ordre ${ordre}`,
                  }))}
                />
              </div>
              <div className="flex-1">
                <FieldSelect
                  label={`Fonction de la marginale de ${configuration.id}`}
                  hideLabel
                  value={configuration.fonctionAgregation}
                  onValueChange={(fonction) =>
                    modifier(configuration.id, {
                      fonctionAgregation: fonctionAgregationSchema.parse(fonction),
                    })
                  }
                  options={Object.entries(FONCTION_MARGINALE_LABEL).map(([value, label]) => ({
                    value,
                    label,
                  }))}
                />
              </div>
              <label className="flex shrink-0 items-center gap-1.5 text-sm text-text">
                <input
                  type="checkbox"
                  checked={configuration.porteObjectifs}
                  onChange={(event) =>
                    modifier(configuration.id, { porteObjectifs: event.target.checked })
                  }
                />
                Porte les objectifs
              </label>
            </li>
          )
        })}
      </ul>
      {erreur ? <p className="mt-2 text-sm text-red-marianne">{erreur}</p> : null}
    </div>
  )
}
