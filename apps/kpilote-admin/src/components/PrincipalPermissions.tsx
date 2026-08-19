import {
  CollectionPermissionAction,
  IndicateurPermissionAction,
  type IndicateurPermissionWriteActionValue,
  type PrincipalPermissionsApiModel,
} from '@pilote/kpilote-shared/permission'
import { useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query'
import { Lock } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { useForm, useWatch } from 'react-hook-form'

import { replacePrincipalPermissions } from '@/api/permissions'
import { CollectionSearchModal } from '@/components/CollectionSearchModal'
import { IndicateurPicker } from '@/components/permissions/IndicateurPicker'
import { compterModifications } from '@/components/permissions/modifications'
import { PermissionSection, type PermissionRow } from '@/components/permissions/PermissionSection'
import { Button } from '@pilote/kpilote-ui/Button'
import { EmptyState } from '@pilote/kpilote-ui/EmptyState'
import { useToast } from '@pilote/kpilote-ui/Toast'
import { extractApiError } from '@/lib/apiError'
import { clsxm } from '@/lib/clsxm'
import { useProdEditUnlock } from '@/lib/useProdEditUnlock'
import { principalPermissionsQueryOptions } from '@/queries/permissions'

type IndicateurRow = PermissionRow<IndicateurPermissionWriteActionValue>
type CollectionRow = PermissionRow<'WRITE_COMMENT'>

type PermissionsFormValues = {
  indicateurs: IndicateurRow[]
  collections: CollectionRow[]
}

const INDICATEUR_WRITE_OPTIONS = [
  { value: IndicateurPermissionAction.WRITE_DATA, label: 'Données' },
  { value: IndicateurPermissionAction.WRITE_COMMENT, label: 'Commentaires' },
] as const

const COLLECTION_WRITE_OPTIONS = [
  { value: CollectionPermissionAction.WRITE_COMMENT, label: 'Commentaires' },
] as const

const toFormValues = (data: PrincipalPermissionsApiModel): PermissionsFormValues => ({
  indicateurs: data.indicateurs.map((indicateur) => ({
    publicId: indicateur.publicId,
    nom: indicateur.nom,
    writeActions: indicateur.actions.filter(
      (action): action is IndicateurPermissionWriteActionValue =>
        action !== IndicateurPermissionAction.READ,
    ),
  })),
  collections: data.collections.map((collection) => ({
    publicId: collection.publicId,
    nom: collection.nom,
    writeActions: collection.actions.filter(
      (action): action is 'WRITE_COMMENT' => action !== CollectionPermissionAction.READ,
    ),
  })),
})

// READ est réinjecté ici, et seulement ici : c'est l'invariant de l'écran
// d'administration, l'API accepte une écriture sans lecture.
const toApiBody = (principalId: string, values: PermissionsFormValues) => ({
  principalId,
  indicateurs: values.indicateurs.map((row) => ({
    publicId: row.publicId,
    actions: [IndicateurPermissionAction.READ, ...row.writeActions],
  })),
  collections: values.collections.map((row) => ({
    publicId: row.publicId,
    actions: [CollectionPermissionAction.READ, ...row.writeActions],
  })),
})

export function PrincipalPermissions({ principalId }: { principalId: string }) {
  const queryClient = useQueryClient()
  const toast = useToast()
  const { isProd, locked, unlock } = useProdEditUnlock()
  const [modal, setModal] = useState<'collection' | null>(null)

  const options = principalPermissionsQueryOptions(principalId)
  const { data } = useSuspenseQuery(options)

  const initialValues = toFormValues(data)
  const {
    control,
    handleSubmit,
    reset,
    formState: { isDirty },
  } = useForm<PermissionsFormValues>({ defaultValues: initialValues })

  const mutation = useMutation({
    mutationFn: (values: PermissionsFormValues) =>
      replacePrincipalPermissions(toApiBody(principalId, values)),
    onSuccess: (fresh) => {
      queryClient.setQueryData(options.queryKey, fresh)
      reset(toFormValues(fresh))
      toast({ title: 'Permissions mises à jour.' })
    },
    onError: (err: unknown) => toast({ title: extractApiError(err), variant: 'error' }),
  })

  const disabled = mutation.isPending

  const indicateursCourants = useWatch({ control, name: 'indicateurs' }) ?? []
  const collectionsCourantes = useWatch({ control, name: 'collections' }) ?? []

  const initialIndicateurIds = new Set(initialValues.indicateurs.map((row) => row.publicId))
  const initialCollectionIds = new Set(initialValues.collections.map((row) => row.publicId))

  const nouveauxIndicateurs = new Set(
    indicateursCourants
      .map((row) => row.publicId)
      .filter((publicId) => !initialIndicateurIds.has(publicId)),
  )
  const nouvellesCollections = new Set(
    collectionsCourantes
      .map((row) => row.publicId)
      .filter((publicId) => !initialCollectionIds.has(publicId)),
  )

  const nombreModifications =
    compterModifications(initialValues.indicateurs, indicateursCourants) +
    compterModifications(initialValues.collections, collectionsCourantes)

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

      <form onSubmit={(event) => void handleSubmit((values) => mutation.mutate(values))(event)}>
        <PermissionSection<PermissionsFormValues, IndicateurPermissionWriteActionValue>
          title="Indicateurs"
          control={control}
          name="indicateurs"
          writeActions={INDICATEUR_WRITE_OPTIONS}
          disabled={disabled}
          nouveauxPublicIds={nouveauxIndicateurs}
          addControl={(append, publicIds) => (
            <IndicateurPicker
              excludedIds={[
                ...publicIds,
                ...data.indicateursHerites.map((herite) => herite.publicId),
              ]}
              onSelect={(indicateur) =>
                append({ publicId: indicateur.id, nom: indicateur.nom, writeActions: [] })
              }
              disabled={disabled}
            />
          )}
        />

        <PermissionSection<PermissionsFormValues, 'WRITE_COMMENT'>
          title="Collections"
          control={control}
          name="collections"
          writeActions={COLLECTION_WRITE_OPTIONS}
          disabled={disabled}
          nouveauxPublicIds={nouvellesCollections}
          extraForRow={renderHeritesForCollection}
          addControl={(append, publicIds) => (
            <>
              <Button
                variant="secondary"
                size="sm"
                type="button"
                disabled={disabled}
                onClick={() => setModal('collection')}
              >
                + Ajouter une collection
              </Button>
              {modal === 'collection' ? (
                <CollectionSearchModal
                  excludedPublicIds={publicIds}
                  onSelect={(hit) => {
                    append({ publicId: hit.publicId, nom: hit.nom, writeActions: [] })
                    setModal(null)
                  }}
                  onClose={() => setModal(null)}
                />
              ) : null}
            </>
          )}
        />

        {isDirty ? (
          <div className="mt-6 flex items-center justify-between gap-4 border-t border-border pt-4">
            <span className="text-sm text-text-muted">
              {nombreModifications} modification{nombreModifications > 1 ? 's' : ''} non enregistrée
              {nombreModifications > 1 ? 's' : ''}
            </span>
            <span className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                type="button"
                disabled={disabled}
                onClick={() => reset(initialValues)}
              >
                Annuler
              </Button>
              <Button size="sm" type="submit" disabled={disabled || locked}>
                {mutation.isPending
                  ? 'Enregistrement…'
                  : isProd
                    ? '🚨 Enregistrer en Prod'
                    : 'Enregistrer'}
              </Button>
            </span>
          </div>
        ) : null}
      </form>
    </section>
  )
}
