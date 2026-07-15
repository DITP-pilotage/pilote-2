import type { FeatureFlippingEtat } from '@pilote/kpilote-shared/featureFlipping'
import type { UtilisateurApiModel } from '@pilote/kpilote-shared/utilisateur'
import { useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute, Link } from '@tanstack/react-router'
import { Users } from 'lucide-react'
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

const initiales = (utilisateur: UtilisateurApiModel): string =>
  `${utilisateur.prenom.at(0) ?? ''}${utilisateur.nom.at(0) ?? ''}`.toUpperCase()

function FeatureFlippingDetailComponent() {
  const { id } = Route.useParams()
  const queryClient = useQueryClient()
  const { data: ff } = useSuspenseQuery(featureFlippingQueryOptions(id))
  const [error, setError] = useState<string | null>(null)
  const [modaleOuverte, setModaleOuverte] = useState(false)

  const cibleUtilisateurs = ff.etat === 'ACTIVE_POUR_UTILISATEUR'

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
      <PageHeading title={ff.nom} subtitle={<span className="font-mono">{ff.key}</span>} />

      {error ? <p className="mb-4 text-sm font-medium text-accent">{error}</p> : null}

      <div className="flex flex-col gap-8">
        <section className="rounded-xl border border-border bg-surface p-6">
          <SegmentedControl
            label="État"
            value={ff.etat}
            onValueChange={(etat) => etatMutation.mutate(etat)}
            options={ETAT_OPTIONS}
          />
          <p className="mt-3 text-xs text-text-muted">
            {ff.etat === 'ACTIVE'
              ? 'Actif pour tous les utilisateurs.'
              : ff.etat === 'ACTIVE_POUR_UTILISATEUR'
                ? 'Actif uniquement pour les utilisateurs autorisés ci-dessous.'
                : 'Inactif pour tous les utilisateurs.'}
          </p>
        </section>

        <section className="rounded-xl border border-border bg-surface p-6">
          <div className="mb-4 flex items-center justify-between gap-4">
            <h2 className="text-sm font-semibold text-text">
              Utilisateurs autorisés{' '}
              <span className="text-text-muted">({ff.utilisateursAutorises.length})</span>
            </h2>
            <Button
              variant="secondary"
              size="sm"
              type="button"
              onClick={() => setModaleOuverte(true)}
            >
              <Users className="size-4" /> Gérer
            </Button>
          </div>

          {!cibleUtilisateurs ? (
            <p className="mb-4 rounded-md bg-surface-tinted px-3 py-2 text-xs text-text-muted">
              Cette liste n’a d’effet que dans l’état «&nbsp;Utilisateurs autorisés&nbsp;».
            </p>
          ) : null}

          {ff.utilisateursAutorises.length === 0 ? (
            <p className="py-6 text-center text-sm text-text-muted">Aucun utilisateur autorisé.</p>
          ) : (
            <ul className="space-y-1">
              {ff.utilisateursAutorises.map((utilisateur) => (
                <li
                  key={utilisateur.id}
                  className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-surface-tinted"
                >
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                    {initiales(utilisateur)}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm text-text">
                      {utilisateur.prenom} {utilisateur.nom}
                    </span>
                    <span className="block truncate text-xs text-text-muted">
                      {utilisateur.email}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
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
