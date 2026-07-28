import type { CollectionApiModel } from '@pilote/kpilote-shared/collection'
import { useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query'
import { Trash2 } from 'lucide-react'

import { addCollectionResponsable, removeCollectionResponsable } from '@/api/collections'
import { ProdEditSectionHeader } from '@/components/ProdEditSectionHeader'
import { UtilisateurPicker } from '@/components/UtilisateurPicker'
import { EmptyState } from '@pilote/kpilote-ui/EmptyState'
import { useToast } from '@pilote/kpilote-ui/Toast'
import { extractApiError } from '@/lib/apiError'
import { useProdEditUnlock } from '@/lib/useProdEditUnlock'
import { collectionQueryOptions } from '@/queries/collections'

export function CollectionResponsables({ collectionId }: { collectionId: string }) {
  const queryClient = useQueryClient()
  const toast = useToast()
  const { isProd, locked, unlock } = useProdEditUnlock()

  const options = collectionQueryOptions(collectionId)
  const { data: collection } = useSuspenseQuery(options)

  const mutation = useMutation({
    mutationFn: (run: () => Promise<CollectionApiModel | void>) => run(),
    onSuccess: async (fresh) => {
      // Le retrait ne renvoie rien (204) : on invalide au lieu de réécrire.
      if (fresh) queryClient.setQueryData(options.queryKey, fresh)
      else await queryClient.invalidateQueries({ queryKey: options.queryKey })
      await queryClient.invalidateQueries({ queryKey: ['collections'] })
      toast({ title: 'Responsables mis à jour.' })
    },
    onError: (err: unknown) => toast({ title: extractApiError(err), variant: 'error' }),
  })

  const disabled = locked || mutation.isPending

  return (
    <section className="flex flex-col gap-4 rounded-xl border border-border bg-surface p-6">
      <ProdEditSectionHeader
        titre="Responsables"
        isProd={isProd}
        locked={locked}
        onUnlock={unlock}
      />

      <p className="text-xs text-text-subtle">
        Désignation métier, sans effet sur les droits d’accès.
      </p>

      <UtilisateurPicker
        excludedIds={collection.responsables.map((responsable) => responsable.id)}
        onSelect={(utilisateur) =>
          mutation.mutate(() =>
            addCollectionResponsable(collectionId, { utilisateurId: utilisateur.id }),
          )
        }
        disabled={disabled}
        placeholder="Ajouter un responsable"
      />

      {collection.responsables.length === 0 ? (
        <EmptyState
          title="Aucun responsable"
          description="Désignez un responsable pour cette collection."
        />
      ) : (
        <ul className="divide-y divide-border rounded-lg border border-border">
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
                  mutation.mutate(() => removeCollectionResponsable(collectionId, responsable.id))
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
    </section>
  )
}
