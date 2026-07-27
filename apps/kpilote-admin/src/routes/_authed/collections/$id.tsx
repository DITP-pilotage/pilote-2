import { useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'

import { deleteCollection, upsertCollection } from '@/api/collections'
import { Breadcrumb } from '@/components/Breadcrumb'
import {
  buildCollectionInitialValues,
  CollectionForm,
  toCollectionBody,
  type CollectionFormValues,
} from '@/components/collections/CollectionForm'
import { CollectionIndicateurs } from '@/components/collections/CollectionIndicateurs'
import { CollectionUtilisateurs } from '@/components/collections/CollectionUtilisateurs'
import { PageHeading } from '@/components/PageHeading'
import { Button } from '@pilote/kpilote-ui/Button'
import { Tabs, TabsList, TabsTrigger } from '@pilote/kpilote-ui/Tabs'
import { useToast } from '@pilote/kpilote-ui/Toast'
import { extractApiError } from '@/lib/apiError'
import { collectionPermissionsQueryOptions, collectionQueryOptions } from '@/queries/collections'
import { indicateursAllQueryOptions } from '@/queries/indicateurs'
import { utilisateursAllQueryOptions } from '@/queries/utilisateurs'

type Onglet = 'details' | 'indicateurs' | 'utilisateurs'

export const Route = createFileRoute('/_authed/collections/$id')({
  loader: async ({ context, params }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(collectionQueryOptions(params.id)),
      context.queryClient.ensureQueryData(collectionPermissionsQueryOptions(params.id)),
      context.queryClient.ensureQueryData(indicateursAllQueryOptions()),
      context.queryClient.ensureQueryData(utilisateursAllQueryOptions()),
    ])
  },
  component: EditCollectionComponent,
})

function EditCollectionComponent() {
  const { id } = Route.useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const toast = useToast()
  const [onglet, setOnglet] = useState<Onglet>('details')

  const { data: collection } = useSuspenseQuery(collectionQueryOptions(id))

  const invalider = async () => {
    await queryClient.invalidateQueries({ queryKey: ['collections'] })
    await queryClient.invalidateQueries({ queryKey: ['collection', id] })
  }

  const modification = useMutation({
    mutationFn: (values: CollectionFormValues) => upsertCollection(id, toCollectionBody(values)),
    onSuccess: async () => {
      await invalider()
      toast({ title: 'Collection modifiée.' })
    },
    onError: (err: unknown) => toast({ title: extractApiError(err), variant: 'error' }),
  })

  const suppression = useMutation({
    mutationFn: () => deleteCollection(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['collections'] })
      toast({ title: 'Collection supprimée.' })
      await navigate({ to: '/collections' })
    },
    onError: (err: unknown) => toast({ title: extractApiError(err), variant: 'error' }),
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
        <span className="font-medium text-text">{collection.nom}</span>
      </Breadcrumb>
      <PageHeading
        title={collection.nom}
        subtitle={<span className="font-mono">{collection.id}</span>}
      />

      <Tabs value={onglet} onValueChange={(valeur) => setOnglet(valeur as Onglet)}>
        <TabsList className="mb-6">
          <TabsTrigger value="details">Détails</TabsTrigger>
          <TabsTrigger value="indicateurs">
            Indicateurs ({collection.indicateurs.length})
          </TabsTrigger>
          <TabsTrigger value="utilisateurs">Utilisateurs</TabsTrigger>
        </TabsList>
      </Tabs>

      {onglet === 'details' ? (
        <>
          <CollectionForm
            mode="update"
            initial={buildCollectionInitialValues(collection)}
            pending={modification.isPending}
            onCancel={() => void navigate({ to: '/collections' })}
            onSubmit={(values) => modification.mutate(values)}
          />

          <div className="mt-8 rounded-xl border border-red-marianne/40 bg-red-marianne/5 p-6">
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
        </>
      ) : null}

      {onglet === 'indicateurs' ? <CollectionIndicateurs collectionId={id} /> : null}

      {onglet === 'utilisateurs' ? <CollectionUtilisateurs collectionId={id} /> : null}
    </div>
  )
}
