import type { UtilisateurApiModel } from '@pilote/kpilote-shared/utilisateur'
import { useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute, Link } from '@tanstack/react-router'
import { Trash2 } from 'lucide-react'

import { remplacerUtilisateursAutorises } from '@/api/feature'
import { Breadcrumb } from '@/components/Breadcrumb'
import { PageHeading } from '@/components/PageHeading'
import { UtilisateurPicker } from '@/components/UtilisateurPicker'
import { SegmentedField } from '@pilote/kpilote-ui/SegmentedField'
import { useToast } from '@pilote/kpilote-ui/Toast'
import { extractApiError } from '@/lib/apiError'
import { featureQueryOptions, useModifierEtatFeatureMutation } from '@/queries/feature'
import { utilisateursAllQueryOptions } from '@/queries/utilisateurs'

export const Route = createFileRoute('/_authed/features/$id')({
  loader: ({ context, params }) =>
    Promise.all([
      context.queryClient.fetchQuery(featureQueryOptions(params.id)),
      context.queryClient.fetchQuery(utilisateursAllQueryOptions()),
    ]),
  component: FeatureDetailComponent,
})

const ETAT_OPTIONS = [
  { value: 'ACTIVE', label: 'Tous' },
  { value: 'ACTIVE_POUR_UTILISATEUR', label: 'Utilisateurs autorisés' },
  { value: 'DESACTIVE', label: 'Désactivé' },
] as const

const initiales = (utilisateur: UtilisateurApiModel): string =>
  `${utilisateur.prenom.at(0) ?? ''}${utilisateur.nom.at(0) ?? ''}`.toUpperCase()

function FeatureDetailComponent() {
  const { id } = Route.useParams()
  const queryClient = useQueryClient()
  const { data: feature } = useSuspenseQuery(featureQueryOptions(id))
  const toast = useToast()

  const cibleUtilisateurs = feature.etat === 'ACTIVE_POUR_UTILISATEUR'
  const utilisateurIdsAutorises = feature.utilisateursAutorises.map((u) => u.id)

  const etatMutation = useModifierEtatFeatureMutation({
    onSuccess: () => toast({ title: 'État mis à jour.' }),
    onError: (err) => toast({ title: extractApiError(err), variant: 'error' }),
  })

  const utilisateursMutation = useMutation({
    mutationFn: (utilisateurIds: string[]) => remplacerUtilisateursAutorises(id, utilisateurIds),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['features'] })
      toast({ title: 'Utilisateurs autorisés mis à jour.' })
    },
    onError: (err: unknown) => toast({ title: extractApiError(err), variant: 'error' }),
  })

  const ajouter = (utilisateurId: string) =>
    utilisateursMutation.mutate([...utilisateurIdsAutorises, utilisateurId])
  const retirer = (utilisateurId: string) =>
    utilisateursMutation.mutate(utilisateurIdsAutorises.filter((x) => x !== utilisateurId))

  return (
    <div>
      <Breadcrumb>
        <Link to="/fonctionnalites" className="hover:text-primary">
          Fonctionnalités
        </Link>
        <Link to="/features" className="hover:text-primary">
          Features
        </Link>
        <span className="font-medium text-text">{feature.nom}</span>
      </Breadcrumb>
      <PageHeading
        title={feature.nom}
        subtitle={<span className="font-mono">{feature.key}</span>}
      />

      <div className="flex flex-col gap-8">
        <section className="rounded-xl border border-border bg-surface p-6">
          <SegmentedField
            label="État"
            value={feature.etat}
            onValueChange={(etat) => etatMutation.mutate({ id, etat })}
            options={ETAT_OPTIONS}
          />
          <p className="mt-3 text-xs text-text-muted">
            {feature.etat === 'ACTIVE'
              ? 'Actif pour tous les utilisateurs.'
              : feature.etat === 'ACTIVE_POUR_UTILISATEUR'
                ? 'Actif uniquement pour les utilisateurs autorisés ci-dessous.'
                : 'Inactif pour tous les utilisateurs.'}
          </p>
        </section>

        <section className="rounded-xl border border-border bg-surface p-6">
          <div className="mb-4 flex items-center justify-between gap-4">
            <h2 className="text-sm font-semibold text-text">
              Utilisateurs autorisés{' '}
              <span className="text-text-muted">({feature.utilisateursAutorises.length})</span>
            </h2>
          </div>

          {!cibleUtilisateurs ? (
            <p className="mb-4 rounded-md bg-surface-tinted px-3 py-2 text-xs text-text-muted">
              Cette liste n’a d’effet que dans l’état «&nbsp;Utilisateurs autorisés&nbsp;».
            </p>
          ) : null}

          <div className="mb-4">
            <UtilisateurPicker
              excludedIds={utilisateurIdsAutorises}
              onSelect={(utilisateur) => ajouter(utilisateur.id)}
              disabled={utilisateursMutation.isPending}
              placeholder="Ajouter un utilisateur…"
            />
          </div>

          {feature.utilisateursAutorises.length === 0 ? (
            <p className="py-6 text-center text-sm text-text-muted">Aucun utilisateur autorisé.</p>
          ) : (
            <ul className="space-y-1">
              {feature.utilisateursAutorises.map((utilisateur) => (
                <li
                  key={utilisateur.id}
                  className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-surface-tinted"
                >
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                    {initiales(utilisateur)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm text-text">
                      {utilisateur.prenom} {utilisateur.nom}
                    </span>
                    <span className="block truncate text-xs text-text-muted">
                      {utilisateur.email}
                    </span>
                  </span>
                  <button
                    type="button"
                    aria-label={`Retirer ${utilisateur.prenom} ${utilisateur.nom}`}
                    disabled={utilisateursMutation.isPending}
                    onClick={() => retirer(utilisateur.id)}
                    className="shrink-0 rounded-md p-1.5 text-text-muted hover:bg-red-marianne/10 hover:text-red-marianne disabled:opacity-50"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  )
}
