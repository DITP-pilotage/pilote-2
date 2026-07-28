import { useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'

import { deleteCollection, upsertCollection } from '@/api/collections'
import {
  buildCollectionInitialValues,
  CollectionForm,
  toCollectionBody,
  type CollectionFormValues,
} from '@/components/collections/CollectionForm'
import { Button } from '@pilote/kpilote-ui/Button'
import { useToast } from '@pilote/kpilote-ui/Toast'
import { extractApiError } from '@/lib/apiError'
import { collectionQueryOptions } from '@/queries/collections'

export function CollectionDetails({ collectionId }: { collectionId: string }) {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const toast = useToast()

  const { data: collection } = useSuspenseQuery(collectionQueryOptions(collectionId))

  const modification = useMutation({
    mutationFn: (values: CollectionFormValues) =>
      upsertCollection(collectionId, toCollectionBody(values)),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['collections'] })
      await queryClient.invalidateQueries({ queryKey: ['collection', collectionId] })
      toast({ title: 'Collection modifiée.' })
    },
    onError: (err: unknown) => toast({ title: extractApiError(err), variant: 'error' }),
  })

  const suppression = useMutation({
    mutationFn: () => deleteCollection(collectionId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['collections'] })
      toast({ title: 'Collection supprimée.' })
      await navigate({ to: '/collections' })
    },
    onError: (err: unknown) => toast({ title: extractApiError(err), variant: 'error' }),
  })

  return (
    <div className="flex flex-col gap-4">
      <CollectionForm
        mode="update"
        initial={buildCollectionInitialValues(collection)}
        pending={modification.isPending}
        onCancel={() => void navigate({ to: '/collections' })}
        onSubmit={(values) => modification.mutate(values)}
      />

      <div className="rounded-xl border border-red-marianne/40 bg-red-marianne/5 p-6">
        <h2 className="text-base font-semibold text-text">Supprimer la collection</h2>
        <p className="mt-1 text-sm text-text-muted">
          La suppression est définitive. Elle retire aussi les indicateurs affectés, les
          responsables, les accès et les commentaires. Les indicateurs eux-mêmes sont conservés.
        </p>
        <Button
          type="button"
          variant="secondary"
          disabled={suppression.isPending}
          onClick={() => {
            if (window.confirm(`Supprimer définitivement la collection ${collection.nom} ?`))
              suppression.mutate()
          }}
          className="mt-4 border-red-marianne bg-red-marianne text-primary-foreground hover:bg-red-marianne"
        >
          {suppression.isPending ? 'Suppression…' : 'Supprimer la collection'}
        </Button>
      </div>
    </div>
  )
}
