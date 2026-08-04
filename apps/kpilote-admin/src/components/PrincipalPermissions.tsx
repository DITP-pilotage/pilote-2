import {
  CollectionPermissionAction,
  IndicateurPermissionAction,
  type IndicateurPermissionWriteActionValue,
  type PrincipalPermissionsApiModel,
} from '@pilote/kpilote-shared/permission'
import { useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query'
import { Lock } from 'lucide-react'
import { useState, type ReactNode } from 'react'

import {
  grantCollectionPermission,
  grantIndicateurPermission,
  revokeCollectionPermission,
  revokeIndicateurPermission,
} from '@/api/permissions'
import { CollectionSearchModal } from '@/components/CollectionSearchModal'
import { IndicateurPicker } from '@/components/permissions/IndicateurPicker'
import { PermissionSection } from '@/components/permissions/PermissionSection'
import { Button } from '@pilote/kpilote-ui/Button'
import { EmptyState } from '@pilote/kpilote-ui/EmptyState'
import { useToast } from '@pilote/kpilote-ui/Toast'
import { extractApiError } from '@/lib/apiError'
import { clsxm } from '@/lib/clsxm'
import { useProdEditUnlock } from '@/lib/useProdEditUnlock'
import { principalPermissionsQueryOptions } from '@/queries/permissions'


export function PrincipalPermissions({ principalId }: { principalId: string }) {
  const queryClient = useQueryClient()
  const toast = useToast()
  const { isProd, locked, unlock } = useProdEditUnlock()
  const [modal, setModal] = useState<'collection' | null>(null)

  const options = principalPermissionsQueryOptions(principalId)
  const { data } = useSuspenseQuery(options)

  const mutation = useMutation({
    mutationFn: (run: () => Promise<PrincipalPermissionsApiModel>) => run(),
    onSuccess: (fresh) => {
      queryClient.setQueryData(options.queryKey, fresh)
      toast({ title: 'Permissions mises à jour.' })
    },
    onError: (err: unknown) => toast({ title: extractApiError(err), variant: 'error' }),
  })

  const disabled = locked || mutation.isPending

  const run = (task: () => Promise<PrincipalPermissionsApiModel>) => {
    mutation.mutate(task)
  }

  // Indicateurs — appels directs, aucune factorisation avec les collections.
  const addIndicateur = (indicateurPublicId: string) => {
    run(() =>
      grantIndicateurPermission({
        principalId,
        indicateurPublicId,
        action: IndicateurPermissionAction.READ,
      }),
    )
  }
  const toggleIndicateurWrite =
    (action: IndicateurPermissionWriteActionValue) =>
    (indicateurPublicId: string, active: boolean) =>
      run(() =>
        active
          ? revokeIndicateurPermission({ principalId, indicateurPublicId, action })
          : grantIndicateurPermission({ principalId, indicateurPublicId, action }),
      )
  const removeIndicateur = (indicateurPublicId: string) =>
    run(() => revokeIndicateurPermission({ principalId, indicateurPublicId }))

  // Collections — appels directs, aucune factorisation avec les indicateurs.
  const addCollection = (collectionPublicId: string) => {
    setModal(null)
    run(() =>
      grantCollectionPermission({
        principalId,
        collectionPublicId,
        action: CollectionPermissionAction.READ,
      }),
    )
  }
  const toggleCollectionWriteComment = (collectionPublicId: string, active: boolean) =>
    run(() =>
      active
        ? revokeCollectionPermission({
            principalId,
            collectionPublicId,
            action: CollectionPermissionAction.WRITE_COMMENT,
          })
        : grantCollectionPermission({
            principalId,
            collectionPublicId,
            action: CollectionPermissionAction.WRITE_COMMENT,
          }),
    )
  const removeCollection = (collectionPublicId: string) =>
    run(() => revokeCollectionPermission({ principalId, collectionPublicId }))

  const heritesByCollection = new Map<string, typeof data.indicateursHerites>()
  for (const herite of data.indicateursHerites) {
    const list = heritesByCollection.get(herite.viaCollectionPublicId) ?? []
    list.push(herite)
    heritesByCollection.set(herite.viaCollectionPublicId, list)
  }

  const renderHeritesForCollection = (collectionPublicId: string): ReactNode => {
    const herites = heritesByCollection.get(collectionPublicId)
    if (!herites || herites.length === 0) return null
    return (
      <ul className="mt-2 space-y-1.5 border-l-2 border-dashed border-border pl-3">
        {herites.map((herite) => (
          <li
            key={herite.publicId}
            className="flex items-center gap-2 text-text-subtle"
            title="Lecture héritée via cette collection"
          >
            <span className="min-w-0 flex-1 truncate text-xs">{herite.nom}</span>
            <span className="shrink-0 font-mono text-xs">{herite.publicId}</span>
            <span className="shrink-0 text-xs italic">Lecture héritée</span>
          </li>
        ))}
      </ul>
    )
  }

  const excludedCollections = data.collections.map((p) => p.publicId)
  const excludedIndicateurs = [
    ...data.indicateurs.map((i) => i.publicId),
    ...data.indicateursHerites.map((i) => i.publicId),
  ]

  const isEmpty =
    data.collections.length === 0 &&
    data.indicateurs.length === 0 &&
    data.indicateursHerites.length === 0

  return (
    <section className="rounded-xl border border-border bg-surface p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-text">Permissions</h2>
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
              if (window.confirm("Déverrouiller l'édition des permissions en PRODUCTION ?"))
                unlock()
            }}
            className="border-red-marianne bg-red-marianne text-primary-foreground hover:bg-red-marianne"
          >
            Déverrouiller l'édition en PROD
          </Button>
        </div>
      ) : null}

      {isEmpty ? (
        <EmptyState
          title="Aucune permission"
          description="Ce principal n'a aucune permission directe. Ajoutez une collection ou un indicateur."
        />
      ) : null}

      <PermissionSection
        title="Indicateurs"
        rows={data.indicateurs}
        addControl={
          <IndicateurPicker
            excludedIds={excludedIndicateurs}
            onSelect={addIndicateur}
            disabled={disabled}
          />
        }
        disabled={disabled}
        onRemove={removeIndicateur}
        writePermissions={[
          {
            value: 'data',
            label: 'Données',
            isActive: (actions) => actions.includes(IndicateurPermissionAction.WRITE_DATA),
            onToggle: toggleIndicateurWrite(IndicateurPermissionAction.WRITE_DATA),
          },
          {
            value: 'comment',
            label: 'Commentaires',
            isActive: (actions) => actions.includes(IndicateurPermissionAction.WRITE_COMMENT),
            onToggle: toggleIndicateurWrite(IndicateurPermissionAction.WRITE_COMMENT),
          },
        ]}
      />

      <PermissionSection
        title="Collections"
        rows={data.collections}
        addControl={
          <Button
            variant="secondary"
            size="sm"
            type="button"
            disabled={disabled}
            onClick={() => setModal('collection')}
          >
            + Ajouter une collection
          </Button>
        }
        disabled={disabled}
        onRemove={removeCollection}
        writePermissions={[
          {
            value: 'comment',
            label: 'Commentaires',
            isActive: (actions) => actions.includes(IndicateurPermissionAction.WRITE_COMMENT),
            onToggle: toggleCollectionWriteComment,
          },
        ]}
        extraForRow={renderHeritesForCollection}
      />

      {modal === 'collection' ? (
        <CollectionSearchModal
          excludedPublicIds={excludedCollections}
          onSelect={(hit) => addCollection(hit.publicId)}
          onClose={() => setModal(null)}
        />
      ) : null}
    </section>
  )
}
