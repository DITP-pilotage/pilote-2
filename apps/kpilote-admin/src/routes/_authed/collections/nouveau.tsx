import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'

import { createCollection } from '@/api/collections'
import { Breadcrumb } from '@/components/Breadcrumb'
import {
  buildCollectionInitialValues,
  CollectionForm,
  toCollectionBody,
  type CollectionFormValues,
} from '@/components/collections/CollectionForm'
import { PageHeading } from '@/components/PageHeading'
import { useToast } from '@pilote/kpilote-ui/Toast'
import { extractApiError } from '@/lib/apiError'

export const Route = createFileRoute('/_authed/collections/nouveau')({
  component: NewCollectionComponent,
})

function NewCollectionComponent() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const toast = useToast()

  const mutation = useMutation({
    mutationFn: (values: CollectionFormValues) => createCollection(toCollectionBody(values)),
    onSuccess: async (collection) => {
      await queryClient.invalidateQueries({ queryKey: ['collections'] })
      toast({ title: `Collection ${collection.id} créée.` })
      // On rejoint la fiche et non la liste : les affectations se font dans ses
      // onglets, l'utilisateur y enchaîne directement.
      void navigate({ to: '/collections/$id', params: { id: collection.id } })
    },
    onError: (err: unknown) => {
      toast({ title: extractApiError(err), variant: 'error' })
    },
  })

  return (
    <div>
      <Breadcrumb>
        <Link to="/fonctionnalites" className="hover:text-primary">
          Fonctionnalités
        </Link>
        <Link to="/collections" className="hover:text-primary">
          Collections
        </Link>
        <span className="font-medium text-text">Nouvelle collection</span>
      </Breadcrumb>
      <PageHeading
        title="Nouvelle collection"
        subtitle="L’identifiant public est attribué automatiquement à la création."
      />
      <CollectionForm
        mode="create"
        initial={buildCollectionInitialValues()}
        pending={mutation.isPending}
        onCancel={() => void navigate({ to: '/collections' })}
        onSubmit={(values) => mutation.mutate(values)}
      />
    </div>
  )
}
