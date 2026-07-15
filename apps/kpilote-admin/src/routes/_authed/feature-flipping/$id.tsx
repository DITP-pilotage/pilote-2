import type { FeatureFlippingEtat } from '@pilote/kpilote-shared/featureFlipping'
import { useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'

import { modifierEtatFeatureFlipping, remplacerUtilisateursAutorises } from '@/api/featureFlipping'
import { Breadcrumb } from '@/components/Breadcrumb'
import { FeatureFlippingUtilisateursModal } from '@/components/FeatureFlippingUtilisateursModal'
import { PageHeading } from '@/components/PageHeading'
import { Button } from '@/components/ui/Button'
import { SegmentedControl } from '@/components/ui/SegmentedControl'
import { extractApiError } from '@/lib/apiError'
import { featureFlippingQueryOptions } from '@/queries/featureFlipping'

export const Route = createFileRoute('/_authed/feature-flipping/$id')({
  loader: ({ context, params }) =>
    context.queryClient.ensureQueryData(featureFlippingQueryOptions(params.id)),
  component: FeatureFlippingDetailComponent,
})

const ETAT_OPTIONS = [
  { value: 'ACTIVE', label: 'Tous' },
  { value: 'ACTIVE_POUR_UTILISATEUR', label: 'Utilisateurs autorisés' },
  { value: 'DESACTIVE', label: 'Désactivé' },
] as const

function FeatureFlippingDetailComponent() {
  const { id } = Route.useParams()
  const queryClient = useQueryClient()
  const { data: ff } = useSuspenseQuery(featureFlippingQueryOptions(id))
  const [error, setError] = useState<string | null>(null)
  const [modaleOuverte, setModaleOuverte] = useState(false)

  const invalider = async () => {
    await queryClient.invalidateQueries({ queryKey: ['feature-flipping'] })
  }

  const etatMutation = useMutation({
    mutationFn: (etat: FeatureFlippingEtat) => modifierEtatFeatureFlipping(id, etat),
    onSuccess: invalider,
    onError: (err: unknown) => void extractApiError(err).then(setError),
  })

  const utilisateursMutation = useMutation({
    mutationFn: (utilisateurIds: string[]) => remplacerUtilisateursAutorises(id, utilisateurIds),
    onSuccess: async () => {
      setModaleOuverte(false)
      await invalider()
    },
    onError: (err: unknown) => void extractApiError(err).then(setError),
  })

  return (
    <div>
      <Breadcrumb>
        <Link to="/fonctionnalites" className="hover:text-primary">
          Fonctionnalités
        </Link>
        <Link to="/feature-flipping" className="hover:text-primary">
          Feature flipping
        </Link>
        <span className="font-medium text-text">{ff.nom}</span>
      </Breadcrumb>
      <PageHeading title={ff.nom} subtitle={<code>{ff.key}</code>} />

      {error ? <p className="mb-4 text-sm font-medium text-accent">{error}</p> : null}

      <div className="max-w-xl space-y-6">
        <SegmentedControl
          label="État"
          value={ff.etat}
          onValueChange={(etat) => etatMutation.mutate(etat)}
          options={ETAT_OPTIONS}
        />

        <div>
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-text">
              Utilisateurs autorisés ({ff.utilisateursAutorises.length})
            </h2>
            <Button
              variant="secondary"
              size="sm"
              type="button"
              onClick={() => setModaleOuverte(true)}
            >
              Gérer les utilisateurs
            </Button>
          </div>
          {ff.etat !== 'ACTIVE_POUR_UTILISATEUR' ? (
            <p className="mb-2 text-xs text-text-muted">
              Cette liste n’a d’effet que dans l’état « Utilisateurs autorisés ».
            </p>
          ) : null}
          {ff.utilisateursAutorises.length === 0 ? (
            <p className="text-sm text-text-muted">Aucun utilisateur autorisé.</p>
          ) : (
            <ul className="divide-y divide-border rounded-lg border border-border">
              {ff.utilisateursAutorises.map((utilisateur) => (
                <li key={utilisateur.id} className="px-3 py-2 text-sm">
                  <span className="text-text">
                    {utilisateur.prenom} {utilisateur.nom}
                  </span>{' '}
                  <span className="text-text-muted">· {utilisateur.email}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {modaleOuverte ? (
        <FeatureFlippingUtilisateursModal
          utilisateursInitiaux={ff.utilisateursAutorises}
          pending={utilisateursMutation.isPending}
          onValider={(utilisateurIds) => utilisateursMutation.mutate(utilisateurIds)}
          onClose={() => setModaleOuverte(false)}
        />
      ) : null}
    </div>
  )
}
