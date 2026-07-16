import type {
  PermissionActionValue,
  PrincipalPermissionsApiModel,
} from '@pilote/kpilote-shared/permission'
import { useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query'
import { Eye, Lock, Trash2 } from 'lucide-react'
import { type ReactNode } from 'react'

import {
  grantIndicateurPermission,
  grantPanierPermission,
  revokeIndicateurPermission,
  revokePanierPermission,
} from '@/api/permissions'
import { IndicateurPicker } from '@/components/permissions/IndicateurPicker'
import { PanierPicker } from '@/components/permissions/PanierPicker'
import { Button } from '@pilote/kpilote-ui/Button'
import { EmptyState } from '@pilote/kpilote-ui/EmptyState'
import { useToast } from '@pilote/kpilote-ui/Toast'
import { extractApiError } from '@/lib/apiError'
import { clsxm } from '@/lib/clsxm'
import { useProdEditUnlock } from '@/lib/useProdEditUnlock'
import { principalPermissionsQueryOptions } from '@/queries/permissions'

type DirectRow = { publicId: string; nom: string; actions: PermissionActionValue[] }

type SectionHandlers = {
  onToggleWrite: (publicId: string, active: boolean) => void
  onRemove: (publicId: string) => void
}

export function PrincipalPermissions({ principalId }: { principalId: string }) {
  const queryClient = useQueryClient()
  const toast = useToast()
  const { isProd, locked, unlock } = useProdEditUnlock()

  const options = principalPermissionsQueryOptions(principalId)
  const { data } = useSuspenseQuery(options)

  const mutation = useMutation({
    mutationFn: (run: () => Promise<PrincipalPermissionsApiModel>) => run(),
    onSuccess: (fresh) => {
      queryClient.setQueryData(options.queryKey, fresh)
      toast({ title: 'Permissions mises à jour.' })
    },
    onError: (err: unknown) =>
      void extractApiError(err).then((message) => toast({ title: message, variant: 'error' })),
  })

  const disabled = locked || mutation.isPending

  const run = (task: () => Promise<PrincipalPermissionsApiModel>) => {
    mutation.mutate(task)
  }

  // Indicateurs — appels directs, aucune factorisation avec les paniers.
  const addIndicateur = (indicateurPublicId: string) => {
    run(() => grantIndicateurPermission({ principalId, indicateurPublicId, action: 'READ' }))
  }
  const toggleIndicateurWrite = (indicateurPublicId: string, active: boolean) =>
    run(() =>
      active
        ? revokeIndicateurPermission({ principalId, indicateurPublicId, action: 'WRITE' })
        : grantIndicateurPermission({ principalId, indicateurPublicId, action: 'WRITE' }),
    )
  const removeIndicateur = (indicateurPublicId: string) =>
    run(() => revokeIndicateurPermission({ principalId, indicateurPublicId }))

  // Paniers — appels directs, aucune factorisation avec les indicateurs.
  const addPanier = (panierPublicId: string) => {
    run(() => grantPanierPermission({ principalId, panierPublicId, action: 'READ' }))
  }
  const togglePanierWrite = (panierPublicId: string, active: boolean) =>
    run(() =>
      active
        ? revokePanierPermission({ principalId, panierPublicId, action: 'WRITE' })
        : grantPanierPermission({ principalId, panierPublicId, action: 'WRITE' }),
    )
  const removePanier = (panierPublicId: string) =>
    run(() => revokePanierPermission({ principalId, panierPublicId }))

  const renderSection = (
    title: string,
    rows: DirectRow[],
    addControl: ReactNode,
    handlers: SectionHandlers,
    extraForRow?: (publicId: string) => ReactNode,
  ) => (
    <div className="mb-6">
      <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-text-muted">
        {title}
      </h3>
      <div className="mb-2">{addControl}</div>
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
                    <span
                      title="Lecture toujours accordée pour une ressource ajoutée. Utilisez la corbeille pour la retirer."
                      className="flex items-center gap-1 text-xs font-medium text-text-muted"
                    >
                      <Eye className="size-3.5" /> Lecture
                    </span>
                    <button
                      type="button"
                      disabled={disabled}
                      onClick={() => handlers.onToggleWrite(row.publicId, writeActive)}
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
                      onClick={() => handlers.onRemove(row.publicId)}
                      className="ml-1 text-text-subtle hover:text-red-marianne disabled:opacity-50"
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
              if (window.confirm('Déverrouiller l’édition des permissions en PRODUCTION ?'))
                unlock()
            }}
            className="border-red-marianne bg-red-marianne text-primary-foreground hover:bg-red-marianne"
          >
            Déverrouiller l’édition en PROD
          </Button>
        </div>
      ) : null}

      {isEmpty ? (
        <EmptyState
          title="Aucune permission"
          description="Ce principal n’a aucune permission directe. Ajoutez un panier ou un indicateur."
        />
      ) : null}

      {renderSection(
        'Indicateurs',
        data.indicateurs,
        <IndicateurPicker
          excludedIds={excludedIndicateurs}
          onSelect={addIndicateur}
          disabled={disabled}
        />,
        {
          onToggleWrite: toggleIndicateurWrite,
          onRemove: removeIndicateur,
        },
      )}
      {renderSection(
        'Paniers',
        data.paniers,
        <PanierPicker excludedIds={excludedPaniers} onSelect={addPanier} disabled={disabled} />,
        {
          onToggleWrite: togglePanierWrite,
          onRemove: removePanier,
        },
        renderHeritesForPanier,
      )}
    </section>
  )
}
