import { zodResolver } from '@hookform/resolvers/zod'
import type { CollectionApiModel } from '@pilote/kpilote-shared/collection'
import { useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query'
import { Trash2 } from 'lucide-react'
import { Controller, useForm } from 'react-hook-form'

import {
  addCollectionIndicateur,
  removeCollectionIndicateur,
  updateCollectionIndicateurPonderation,
} from '@/api/collections'
import { IndicateurPicker } from '@/components/permissions/IndicateurPicker'
import { ProdEditSectionHeader } from '@/components/ProdEditSectionHeader'
import { EmptyState } from '@pilote/kpilote-ui/EmptyState'
import { FieldInput } from '@pilote/kpilote-ui/FieldInput'
import { IconButton } from '@pilote/kpilote-ui/IconButton'
import { Subtitle } from '@pilote/kpilote-ui/Subtitle'
import { useToast } from '@pilote/kpilote-ui/Toast'
import { extractApiError } from '@/lib/apiError'
import {
  ponderationFormSchema,
  type PonderationFormInput,
  type PonderationFormValues,
} from '@/lib/ponderationForm'
import { useProdEditUnlock } from '@/lib/useProdEditUnlock'
import { collectionQueryOptions } from '@/queries/collections'
import { indicateursAllQueryOptions } from '@/queries/indicateurs'

// Validation au blur ou sur Entrée : sans formulaire local, chaque frappe
// déclencherait un appel réseau.
function PonderationField({
  valeur,
  disabled,
  onValider,
}: {
  valeur: number
  disabled: boolean
  onValider: (ponderation: number) => void
}) {
  const { control, handleSubmit } = useForm<PonderationFormInput, unknown, PonderationFormValues>({
    resolver: zodResolver(ponderationFormSchema),
    defaultValues: { ponderation: String(valeur) },
  })

  const valider = handleSubmit(({ ponderation }) => {
    if (ponderation !== valeur) onValider(ponderation)
  })

  return (
    <Controller
      control={control}
      name="ponderation"
      render={({ field, fieldState }) => (
        <FieldInput
          label="Pondération"
          hideLabel
          type="number"
          min={0}
          step={0.01}
          disabled={disabled}
          className="w-20 px-2 py-1"
          name={field.name}
          value={field.value}
          onChange={(event) => field.onChange(event.target.value)}
          onBlur={() => {
            field.onBlur()
            void valider()
          }}
          onKeyDown={(event) => {
            if (event.key === 'Enter') event.currentTarget.blur()
          }}
          error={fieldState.error?.message}
        />
      )}
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
        onSelect={(indicateur) =>
          mutation.mutate(() =>
            addCollectionIndicateur(collectionId, { indicateurId: indicateur.id }),
          )
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
              <PonderationField
                // Remonte la valeur du serveur dans le formulaire après mutation.
                key={lien.ponderation}
                valeur={lien.ponderation}
                disabled={disabled}
                onValider={(ponderation) =>
                  mutation.mutate(() =>
                    updateCollectionIndicateurPonderation(collectionId, lien.id, ponderation),
                  )
                }
              />
              <IconButton
                variant="danger"
                label="Retirer l'indicateur"
                disabled={disabled}
                onClick={() =>
                  mutation.mutate(() => removeCollectionIndicateur(collectionId, lien.id))
                }
              >
                <Trash2 />
              </IconButton>
            </li>
          ))}
        </ul>
      )}

      <Subtitle>
        La pondération règle le poids de l’indicateur dans le taux de progression de la collection.
        0 l’exclut du calcul.
      </Subtitle>
    </section>
  )
}
