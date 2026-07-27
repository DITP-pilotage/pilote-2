import type { CollectionApiModel } from '@pilote/kpilote-shared/collection'
import type { PrincipalPermissionsApiModel } from '@pilote/kpilote-shared/permission'
import { useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query'
import { Eye, Lock, Trash2 } from 'lucide-react'

import { addCollectionResponsable, removeCollectionResponsable } from '@/api/collections'
import { grantCollectionPermission, revokeCollectionPermission } from '@/api/permissions'
import { UtilisateurPicker } from '@/components/UtilisateurPicker'
import { Button } from '@pilote/kpilote-ui/Button'
import { useToast } from '@pilote/kpilote-ui/Toast'
import { extractApiError } from '@/lib/apiError'
import { clsxm } from '@/lib/clsxm'
import { useProdEditUnlock } from '@/lib/useProdEditUnlock'
import { collectionPermissionsQueryOptions, collectionQueryOptions } from '@/queries/collections'

const LISTE = 'divide-y divide-border rounded-lg border border-border'
const VIDE =
  'rounded-lg border border-dashed border-border px-3 py-4 text-center text-sm text-text-subtle'

export function CollectionUtilisateurs({ collectionId }: { collectionId: string }) {
  const queryClient = useQueryClient()
  const toast = useToast()
  const { isProd, locked, unlock } = useProdEditUnlock()

  const collectionOptions = collectionQueryOptions(collectionId)
  const permissionsOptions = collectionPermissionsQueryOptions(collectionId)
  const { data: collection } = useSuspenseQuery(collectionOptions)
  const { data: permissions } = useSuspenseQuery(permissionsOptions)

  // Deux mutations distinctes : les routes responsables renvoient la collection,
  // les routes permissions renvoient les permissions du principal. Une seule
  // mutation devrait porter deux formes de réponse sans rapport.
  const responsables = useMutation({
    mutationFn: (run: () => Promise<CollectionApiModel | void>) => run(),
    onSuccess: async (fresh) => {
      if (fresh) queryClient.setQueryData(collectionOptions.queryKey, fresh)
      else await queryClient.invalidateQueries({ queryKey: collectionOptions.queryKey })
      await queryClient.invalidateQueries({ queryKey: ['collections'] })
      toast({ title: 'Responsables mis à jour.' })
    },
    onError: (err: unknown) => toast({ title: extractApiError(err), variant: 'error' }),
  })

  const acces = useMutation({
    mutationFn: (run: () => Promise<PrincipalPermissionsApiModel>) => run(),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: permissionsOptions.queryKey })
      toast({ title: 'Accès mis à jour.' })
    },
    onError: (err: unknown) => toast({ title: extractApiError(err), variant: 'error' }),
  })

  const disabled = locked || responsables.isPending || acces.isPending

  return (
    <section className="rounded-xl border border-border bg-surface p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-text">Utilisateurs</h2>
        {isProd ? (
          <span
            className={clsxm(
              'text-xs font-medium',
              locked ? 'text-red-marianne' : 'text-text-muted',
            )}
          >
            {locked ? 'Édition verrouillée (PROD)' : 'Édition déverrouillée (PROD)'}
          </span>
        ) : null}
      </div>

      {locked ? (
        <div className="mb-5 flex items-center justify-between gap-4 rounded-lg border border-red-marianne/40 bg-red-marianne/5 px-4 py-3">
          <span className="flex items-center gap-2 text-sm text-text">
            <Lock className="size-4 text-red-marianne" /> Modifications désactivées en production.
          </span>
          <Button
            variant="secondary"
            size="sm"
            type="button"
            onClick={() => {
              if (window.confirm("Déverrouiller l'édition des collections en PRODUCTION ?"))
                unlock()
            }}
            className="border-red-marianne bg-red-marianne text-primary-foreground hover:bg-red-marianne"
          >
            Déverrouiller l'édition en PROD
          </Button>
        </div>
      ) : null}

      <div className="mb-8">
        <h3 className="mb-1 text-sm font-semibold uppercase tracking-wide text-text-muted">
          Responsables
        </h3>
        <p className="mb-2 text-xs text-text-subtle">
          Désignation métier, sans effet sur les droits d’accès.
        </p>
        <div className="mb-2">
          <UtilisateurPicker
            excludedIds={collection.responsables.map((responsable) => responsable.id)}
            onSelect={(utilisateur) =>
              responsables.mutate(() =>
                addCollectionResponsable(collectionId, { utilisateurId: utilisateur.id }),
              )
            }
            disabled={disabled}
            placeholder="Ajouter un responsable"
          />
        </div>
        {collection.responsables.length === 0 ? (
          <p className={VIDE}>Aucun responsable désigné.</p>
        ) : (
          <ul className={LISTE}>
            {collection.responsables.map((responsable) => (
              <li key={responsable.id} className="flex items-center gap-3 px-3 py-2.5">
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm text-text">
                    {responsable.prenom} {responsable.nom}
                  </span>
                  <span className="font-mono text-xs text-text-muted">{responsable.email}</span>
                </span>
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() =>
                    responsables.mutate(() =>
                      removeCollectionResponsable(collectionId, responsable.id),
                    )
                  }
                  className="text-text-subtle hover:text-red-marianne disabled:opacity-50"
                  aria-label="Retirer le responsable"
                >
                  <Trash2 className="size-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div>
        <h3 className="mb-1 text-sm font-semibold uppercase tracking-wide text-text-muted">
          Accès
        </h3>
        <p className="mb-2 text-xs text-text-subtle">
          Qui peut lire, et éventuellement écrire, cette collection.
        </p>
        <div className="mb-2">
          <UtilisateurPicker
            excludedIds={permissions.items.map((item) => item.principalId)}
            onSelect={(utilisateur) =>
              acces.mutate(() =>
                grantCollectionPermission({
                  principalId: utilisateur.id,
                  collectionPublicId: collectionId,
                  action: 'READ',
                }),
              )
            }
            disabled={disabled}
            placeholder="Donner accès à un utilisateur"
          />
        </div>
        {permissions.items.length === 0 ? (
          <p className={VIDE}>Aucun accès direct.</p>
        ) : (
          <ul className={LISTE}>
            {permissions.items.map((item) => {
              const ecritureActive = item.actions.includes('WRITE')
              return (
                <li key={item.principalId} className="flex items-center gap-3 px-3 py-2.5">
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm text-text">{item.libelle}</span>
                    {item.type === 'API_KEY' ? (
                      <span className="text-xs text-text-muted">Clé API</span>
                    ) : null}
                  </span>
                  <span
                    title="Lecture toujours accordée pour un principal ajouté. Utilisez la corbeille pour la retirer."
                    className="flex items-center gap-1 text-xs font-medium text-text-muted"
                  >
                    <Eye className="size-3.5" /> Lecture
                  </span>
                  <button
                    type="button"
                    disabled={disabled}
                    onClick={() =>
                      acces.mutate(() =>
                        ecritureActive
                          ? revokeCollectionPermission({
                              principalId: item.principalId,
                              collectionPublicId: collectionId,
                              action: 'WRITE',
                            })
                          : grantCollectionPermission({
                              principalId: item.principalId,
                              collectionPublicId: collectionId,
                              action: 'WRITE',
                            }),
                      )
                    }
                    className={clsxm(
                      'rounded-md border px-2 py-1 text-xs font-medium transition-colors',
                      ecritureActive
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-border bg-surface text-text-muted hover:border-primary',
                      disabled && 'cursor-not-allowed opacity-50',
                    )}
                  >
                    Écriture
                  </button>
                  <button
                    type="button"
                    disabled={disabled}
                    onClick={() =>
                      acces.mutate(() =>
                        revokeCollectionPermission({
                          principalId: item.principalId,
                          collectionPublicId: collectionId,
                        }),
                      )
                    }
                    className="text-text-subtle hover:text-red-marianne disabled:opacity-50"
                    aria-label="Retirer l'accès"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </li>
              )
            })}
          </ul>
        )}
        <p className="mt-3 text-xs text-text-subtle">
          Les clés API sont listées ici mais s’ajoutent depuis « Gérer les clés API ».
        </p>
      </div>
    </section>
  )
}
