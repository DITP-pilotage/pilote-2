import type { PermissionActionValue, PermissionResourceType } from '@pilote/mb-shared/permission'
import { useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query'
import { Eye, Lock, Plus, Trash2 } from 'lucide-react'
import { type ReactNode, useState } from 'react'

import { grantPermission, revokePermission } from '@/api/permissions'
import { ResourceSearchModal, type ResourceHit } from '@/components/ResourceSearchModal'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { extractApiError } from '@/lib/apiError'
import { clsxm } from '@/lib/clsxm'
import { useProdEditUnlock } from '@/lib/useProdEditUnlock'
import { principalPermissionsQueryOptions } from '@/queries/permissions'

type DirectRow = { publicId: string; nom: string; actions: PermissionActionValue[] }

export function PrincipalPermissions({ principalId }: { principalId: string }) {
  const queryClient = useQueryClient()
  const { isProd, locked, unlock } = useProdEditUnlock()
  const [error, setError] = useState<string | null>(null)
  const [modalType, setModalType] = useState<PermissionResourceType | null>(null)

  const options = principalPermissionsQueryOptions(principalId)
  const { data } = useSuspenseQuery(options)

  const grantMutation = useMutation({
    mutationFn: grantPermission,
    onSuccess: (fresh) => queryClient.setQueryData(options.queryKey, fresh),
    onError: (err: unknown) => void extractApiError(err).then(setError),
  })

  const revokeMutation = useMutation({
    mutationFn: revokePermission,
    onSuccess: (fresh) => queryClient.setQueryData(options.queryKey, fresh),
    onError: (err: unknown) => void extractApiError(err).then(setError),
  })

  const pending = grantMutation.isPending || revokeMutation.isPending
  const disabled = locked || pending

  const toggle = (
    resourceType: PermissionResourceType,
    resourcePublicId: string,
    action: PermissionActionValue,
    active: boolean,
  ) => {
    setError(null)
    if (active) {
      revokeMutation.mutate({ principalId, resourceType, resourcePublicId, action })
    } else {
      grantMutation.mutate({ principalId, resourceType, resourcePublicId, action })
    }
  }

  const removeResource = (resourceType: PermissionResourceType, resourcePublicId: string) => {
    setError(null)
    revokeMutation.mutate({ principalId, resourceType, resourcePublicId })
  }

  const addResource = (resourceType: PermissionResourceType, hit: ResourceHit) => {
    setError(null)
    setModalType(null)
    grantMutation.mutate({
      principalId,
      resourceType,
      resourcePublicId: hit.publicId,
      action: 'READ',
    })
  }

  const renderSection = (
    title: string,
    resourceType: PermissionResourceType,
    rows: DirectRow[],
    extraForRow?: (publicId: string) => ReactNode,
  ) => (
    <div className="mb-6">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-text-muted">{title}</h3>
        <Button
          variant="tertiary"
          size="sm"
          type="button"
          disabled={disabled}
          onClick={() => setModalType(resourceType)}
        >
          <Plus className="size-4" /> Ajouter
        </Button>
      </div>
      {rows.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border px-3 py-4 text-center text-sm text-text-subtle">
          Aucune permission directe.
        </p>
      ) : (
        <ul className="divide-y divide-border rounded-lg border border-border">
          {rows.map((row) => {
            const writeActive = row.actions.includes('WRITE')
            const extra = extraForRow?.(row.publicId)
            return (
              <li key={row.publicId} className="px-3 py-2.5">
                <div className="flex items-center gap-3">
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm text-text">{row.nom}</span>
                    <span className="font-mono text-xs text-text-muted">{row.publicId}</span>
                  </span>
                  <span className="flex items-center gap-2.5">
                    {/* Lecture toujours accordée pour une ressource listée : simple libellé
                        informatif (pas une chip cliquable). Se retire via la corbeille. */}
                    <span
                      title="Lecture toujours accordée pour une ressource ajoutée. Utilisez la corbeille pour la retirer."
                      className="flex items-center gap-1 text-xs font-medium text-text-muted"
                    >
                      <Eye className="size-3.5" /> Lecture
                    </span>
                    <button
                      type="button"
                      disabled={disabled}
                      onClick={() => toggle(resourceType, row.publicId, 'WRITE', writeActive)}
                      className={clsxm(
                        'rounded-md border px-2 py-1 text-xs font-medium transition-colors',
                        writeActive
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
                      onClick={() => removeResource(resourceType, row.publicId)}
                      className="ml-1 text-text-subtle hover:text-accent disabled:opacity-50"
                      aria-label="Retirer la ressource"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </span>
                </div>
                {extra}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )

  const heritesByPanier = new Map<string, typeof data.indicateursHerites>()
  for (const herite of data.indicateursHerites) {
    const list = heritesByPanier.get(herite.viaPanierPublicId) ?? []
    list.push(herite)
    heritesByPanier.set(herite.viaPanierPublicId, list)
  }

  const renderHeritesForPanier = (panierPublicId: string): ReactNode => {
    const herites = heritesByPanier.get(panierPublicId)
    if (!herites || herites.length === 0) return null
    return (
      <ul className="mt-2 space-y-1.5 border-l-2 border-dashed border-border pl-3">
        {herites.map((herite) => (
          <li
            key={herite.publicId}
            className="flex items-center gap-2 text-text-subtle"
            title="Lecture héritée via ce panier"
          >
            <span className="min-w-0 flex-1 truncate text-xs">{herite.nom}</span>
            <span className="shrink-0 font-mono text-xs">{herite.publicId}</span>
            <span className="shrink-0 text-xs italic">Lecture héritée</span>
          </li>
        ))}
      </ul>
    )
  }

  const excludedPaniers = data.paniers.map((p) => p.publicId)
  const excludedIndicateurs = [
    ...data.indicateurs.map((i) => i.publicId),
    ...data.indicateursHerites.map((i) => i.publicId),
  ]

  const isEmpty =
    data.paniers.length === 0 &&
    data.indicateurs.length === 0 &&
    data.indicateursHerites.length === 0

  return (
    <section className="rounded-xl border border-border bg-surface p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-text">Permissions</h2>
        {isProd ? (
          <span
            className={clsxm('text-xs font-medium', locked ? 'text-accent' : 'text-text-muted')}
          >
            {locked ? 'Édition verrouillée (PROD)' : 'Édition déverrouillée (PROD)'}
          </span>
        ) : null}
      </div>

      {locked ? (
        <div className="mb-5 flex items-center justify-between gap-4 rounded-lg border border-accent/40 bg-accent/5 px-4 py-3">
          <span className="flex items-center gap-2 text-sm text-text">
            <Lock className="size-4 text-accent" /> Modifications désactivées en production.
          </span>
          <Button
            variant="secondary"
            size="sm"
            type="button"
            onClick={() => {
              if (window.confirm('Déverrouiller l’édition des permissions en PRODUCTION ?'))
                unlock()
            }}
            className="border-accent bg-accent text-primary-foreground hover:bg-accent"
          >
            Déverrouiller l’édition en PROD
          </Button>
        </div>
      ) : null}

      {error ? <p className="mb-4 text-sm font-medium text-accent">{error}</p> : null}

      {isEmpty ? (
        <EmptyState
          title="Aucune permission"
          description="Ce principal n’a aucune permission directe. Ajoutez un panier ou un indicateur."
        />
      ) : null}

      {renderSection('Indicateurs', 'INDICATEUR', data.indicateurs)}
      {renderSection('Paniers', 'PANIER', data.paniers, renderHeritesForPanier)}

      {modalType ? (
        <ResourceSearchModal
          resourceType={modalType}
          excludedPublicIds={modalType === 'PANIER' ? excludedPaniers : excludedIndicateurs}
          onSelect={(hit) => addResource(modalType, hit)}
          onClose={() => setModalType(null)}
        />
      ) : null}
    </section>
  )
}
