import type { CollectionApiModel } from '@pilote/kpilote-shared/collection'
import { useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query'
import { Trash2 } from 'lucide-react'
import { useState } from 'react'

import {
  addCollectionIndicateur,
  removeCollectionIndicateur,
  updateCollectionIndicateurPonderation,
} from '@/api/collections'
import { IndicateurPicker } from '@/components/permissions/IndicateurPicker'
import { ProdEditSectionHeader } from '@/components/ProdEditSectionHeader'
import { EmptyState } from '@pilote/kpilote-ui/EmptyState'
import { useToast } from '@pilote/kpilote-ui/Toast'
import { extractApiError } from '@/lib/apiError'
import { useProdEditUnlock } from '@/lib/useProdEditUnlock'
import { collectionQueryOptions } from '@/queries/collections'
import { indicateursAllQueryOptions } from '@/queries/indicateurs'

// Saisie locale validée au blur ou sur Entrée : sans état local, chaque frappe
// déclencherait un appel réseau.
function PonderationInput({
  valeur,
  disabled,
  onValider,
}: {
  valeur: number
  disabled: boolean
  onValider: (ponderation: number) => void
}) {
  const [saisie, setSaisie] = useState(String(valeur))

  const valider = () => {
    const nombre = Number(saisie)
    if (!Number.isFinite(nombre) || nombre < 0) {
      setSaisie(String(valeur))
      return
    }
    if (nombre === valeur) return
    onValider(nombre)
  }

  return (
    <input
      type="number"
      min={0}
      step={0.01}
      value={saisie}
      disabled={disabled}
      aria-label="Pondération"
      onChange={(event) => setSaisie(event.target.value)}
      onBlur={valider}
      onKeyDown={(event) => {
        if (event.key === 'Enter') event.currentTarget.blur()
      }}
      className="w-20 rounded-md border border-border bg-surface px-2 py-1 text-sm disabled:opacity-50"
    />
  )
}

export function CollectionIndicateurs({ collectionId }: { collectionId: string }) {
  const queryClient = useQueryClient()
  const toast = useToast()
  const { isProd, locked, unlock } = useProdEditUnlock()

  const options = collectionQueryOptions(collectionId)
  const { data: collection } = useSuspenseQuery(options)
  const { data: catalogue } = useSuspenseQuery(indicateursAllQueryOptions())

  const mutation = useMutation({
    mutationFn: (run: () => Promise<CollectionApiModel | void>) => run(),
    onSuccess: async (fresh) => {
      // Le retrait ne renvoie rien (204) : on invalide au lieu de réécrire.
      if (fresh) queryClient.setQueryData(options.queryKey, fresh)
      else await queryClient.invalidateQueries({ queryKey: options.queryKey })
      await queryClient.invalidateQueries({ queryKey: ['collections'] })
      toast({ title: 'Collection mise à jour.' })
    },
    onError: (err: unknown) => toast({ title: extractApiError(err), variant: 'error' }),
  })

  const disabled = locked || mutation.isPending
  const nomParId = new Map(catalogue.map((indicateur) => [indicateur.id, indicateur.nom]))

  return (
    <section className="flex flex-col gap-4 rounded-xl border border-border bg-surface p-6">
      <ProdEditSectionHeader
        titre="Indicateurs"
        isProd={isProd}
        locked={locked}
        onUnlock={unlock}
      />

      <IndicateurPicker
        excludedIds={collection.indicateurs.map((lien) => lien.id)}
        onSelect={(indicateurId) =>
          mutation.mutate(() => addCollectionIndicateur(collectionId, { indicateurId }))
        }
        disabled={disabled}
      />

      {collection.indicateurs.length === 0 ? (
        <EmptyState
          title="Aucun indicateur"
          description="Ajoutez un indicateur à cette collection."
        />
      ) : (
        <ul className="divide-y divide-border rounded-lg border border-border">
          {collection.indicateurs.map((lien) => (
            <li key={lien.id} className="flex items-center gap-3 px-3 py-2.5">
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm text-text">
                  {nomParId.get(lien.id) ?? lien.id}
                </span>
                <span className="font-mono text-xs text-text-muted">{lien.id}</span>
              </span>
              <PonderationInput
                valeur={lien.ponderation}
                disabled={disabled}
                onValider={(ponderation) =>
                  mutation.mutate(() =>
                    updateCollectionIndicateurPonderation(collectionId, lien.id, ponderation),
                  )
                }
              />
              <button
                type="button"
                disabled={disabled}
                onClick={() =>
                  mutation.mutate(() => removeCollectionIndicateur(collectionId, lien.id))
                }
                className="text-text-subtle hover:text-red-marianne disabled:opacity-50"
                aria-label="Retirer l'indicateur"
              >
                <Trash2 className="size-4" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <p className="text-xs text-text-subtle">
        La pondération règle le poids de l’indicateur dans le taux de progression de la collection.
        0 l’exclut du calcul.
      </p>
    </section>
  )
}
