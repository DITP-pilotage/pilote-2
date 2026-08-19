import {
  CollectionPermissionAction,
  type PrincipalPermissionsApiModel,
} from '@pilote/kpilote-shared/permission'
import { useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query'
import { Trash2 } from 'lucide-react'

import { grantCollectionPermission, revokeCollectionPermission } from '@/api/permissions'
import { BadgeLectureAccordee } from '@/components/permissions/BadgeLectureAccordee'
import { ProdEditSectionHeader } from '@/components/ProdEditSectionHeader'
import { UtilisateurPicker } from '@/components/UtilisateurPicker'
import { EmptyState } from '@pilote/kpilote-ui/EmptyState'
import { IconButton } from '@pilote/kpilote-ui/IconButton'
import { Subtitle } from '@pilote/kpilote-ui/Subtitle'
import { useToast } from '@pilote/kpilote-ui/Toast'
import { extractApiError } from '@/lib/apiError'
import { clsxm } from '@/lib/clsxm'
import { useProdEditUnlock } from '@/lib/useProdEditUnlock'
import { collectionPermissionsQueryOptions } from '@/queries/collections'

export function CollectionAcces({ collectionId }: { collectionId: string }) {
  const queryClient = useQueryClient()
  const toast = useToast()
  const { isProd, locked, unlock } = useProdEditUnlock()

  const options = collectionPermissionsQueryOptions(collectionId)
  const { data: permissions } = useSuspenseQuery(options)

  // Les routes de permission renvoient les permissions du principal, pas la
  // collection : on invalide la lecture inverse plutôt que de réécrire un cache.
  const mutation = useMutation({
    mutationFn: (run: () => Promise<PrincipalPermissionsApiModel>) => run(),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: options.queryKey })
      toast({ title: 'Accès mis à jour.' })
    },
    onError: (err: unknown) => toast({ title: extractApiError(err), variant: 'error' }),
  })

  const disabled = locked || mutation.isPending

  return (
    <section className="flex flex-col gap-4 rounded-xl border border-border bg-surface p-6">
      <ProdEditSectionHeader titre="Accès" isProd={isProd} locked={locked} onUnlock={unlock} />

      <Subtitle>Qui peut lire, et éventuellement écrire, cette collection.</Subtitle>

      <UtilisateurPicker
        excludedIds={permissions.items.map((item) => item.principalId)}
        onSelect={(utilisateur) =>
          mutation.mutate(() =>
            grantCollectionPermission({
              principalId: utilisateur.id,
              collectionPublicId: collectionId,
              action: CollectionPermissionAction.READ,
            }),
          )
        }
        disabled={disabled}
        placeholder="Donner accès à un utilisateur"
      />

      {permissions.items.length === 0 ? (
        <EmptyState
          title="Aucun accès direct"
          description="Donnez accès à un utilisateur pour qu’il voie cette collection."
        />
      ) : (
        <ul className="divide-y divide-border rounded-lg border border-border">
          {permissions.items.map((item) => {
            const ecritureActive = item.actions.includes(CollectionPermissionAction.WRITE_COMMENT)
            return (
              <li key={item.principalId} className="flex items-center gap-3 px-3 py-2.5">
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm text-text">{item.libelle}</span>
                  {item.type === 'API_KEY' ? (
                    <span className="text-xs text-text-muted">Clé API</span>
                  ) : null}
                </span>
                <BadgeLectureAccordee title="Lecture toujours accordée pour un principal ajouté. Utilisez la corbeille pour la retirer." />
                <button
                  type="button"
                  aria-pressed={ecritureActive}
                  aria-label={`Droit d’écriture pour ${item.libelle}`}
                  disabled={disabled}
                  onClick={() =>
                    mutation.mutate(() =>
                      ecritureActive
                        ? revokeCollectionPermission({
                            principalId: item.principalId,
                            collectionPublicId: collectionId,
                            action: CollectionPermissionAction.WRITE_COMMENT,
                          })
                        : grantCollectionPermission({
                            principalId: item.principalId,
                            collectionPublicId: collectionId,
                            action: CollectionPermissionAction.WRITE_COMMENT,
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
                <IconButton
                  variant="danger"
                  label="Retirer l'accès"
                  disabled={disabled}
                  onClick={() =>
                    mutation.mutate(() =>
                      revokeCollectionPermission({
                        principalId: item.principalId,
                        collectionPublicId: collectionId,
                      }),
                    )
                  }
                >
                  <Trash2 />
                </IconButton>
              </li>
            )
          })}
        </ul>
      )}

      <Subtitle>
        Les clés API sont listées ici mais s’ajoutent depuis « Gérer les clés API ».
      </Subtitle>
    </section>
  )
}
