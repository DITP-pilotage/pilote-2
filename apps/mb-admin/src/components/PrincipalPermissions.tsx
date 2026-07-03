import type { PermissionActionValue, PermissionResourceType } from '@pilote/mb-shared/permission'
import { useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query'
import { Lock, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'

import { grantPermission, revokePermission } from '@/api/permissions'
import { ResourceSearchModal, type ResourceHit } from '@/components/ResourceSearchModal'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { extractApiError } from '@/lib/apiError'
import { clsxm } from '@/lib/clsxm'
import { useProdEditUnlock } from '@/lib/useProdEditUnlock'
import { principalPermissionsQueryOptions } from '@/queries/permissions'

const ACTIONS: PermissionActionValue[] = ['READ', 'WRITE']

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
            const hasWrite = row.actions.includes('WRITE')
            return (
              <li key={row.publicId} className="flex items-center gap-3 px-3 py-2.5">
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm text-text">{row.nom}</span>
                  <span className="font-mono text-xs text-text-muted">{row.publicId}</span>
                </span>
                <span className="flex items-center gap-1.5">
                  {ACTIONS.map((action) => {
                    const active = row.actions.includes(action)
                    const impliedRead = action === 'READ' && hasWrite
                    return (
                      <button
                        key={action}
                        type="button"
                        disabled={disabled}
                        title={impliedRead ? 'Lecture implicite (WRITE ⇒ READ)' : undefined}
                        onClick={() => toggle(resourceType, row.publicId, action, active)}
                        className={clsxm(
                          'rounded-md border px-2 py-1 text-xs font-medium transition-colors',
                          active
                            ? 'border-primary bg-primary text-primary-foreground'
                            : 'border-border bg-surface text-text-muted hover:border-primary',
                          impliedRead && !active && 'border-dashed opacity-70',
                          disabled && 'cursor-not-allowed opacity-50',
                        )}
                      >
                        {action}
                      </button>
                    )
                  })}
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
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )

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

      {renderSection('Paniers', 'PANIER', data.paniers)}
      {renderSection('Indicateurs', 'INDICATEUR', data.indicateurs)}

      {data.indicateursHerites.length > 0 ? (
        <div className="mb-2">
          <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-text-subtle">
            Indicateurs hérités
          </h3>
          <ul className="divide-y divide-border rounded-lg border border-dashed border-border">
            {data.indicateursHerites.map((row) => (
              <li
                key={row.publicId}
                className="flex items-center gap-3 px-3 py-2.5 text-text-subtle"
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm">{row.nom}</span>
                  <span className="font-mono text-xs">{row.publicId}</span>
                </span>
                <span className="text-xs italic">hérité · via {row.viaPanierPublicId}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

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
