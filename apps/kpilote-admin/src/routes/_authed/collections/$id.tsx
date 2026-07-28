import { useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { z } from 'zod'

import { Breadcrumb } from '@/components/Breadcrumb'
import { CollectionAcces } from '@/components/collections/CollectionAcces'
import { CollectionDetails } from '@/components/collections/CollectionDetails'
import { CollectionIndicateurs } from '@/components/collections/CollectionIndicateurs'
import { CollectionResponsables } from '@/components/collections/CollectionResponsables'
import { PageHeading } from '@/components/PageHeading'
import { Tabs, TabsList, TabsTrigger } from '@pilote/kpilote-ui/Tabs'
import { collectionPermissionsQueryOptions, collectionQueryOptions } from '@/queries/collections'
import { indicateursAllQueryOptions } from '@/queries/indicateurs'
import { utilisateursAllQueryOptions } from '@/queries/utilisateurs'

const searchSchema = z.object({
  onglet: z.enum(['details', 'indicateurs', 'acces', 'responsables']).default('details'),
})

export const Route = createFileRoute('/_authed/collections/$id')({
  validateSearch: searchSchema,
  // Les quatre onglets lisent ces caches : le loader les remplit une fois, et
  // les `useSuspenseQuery` des composants les récupèrent sans nouvel aller-retour.
  loader: async ({ context, params }) => {
    await Promise.all([
      context.queryClient.fetchQuery(collectionQueryOptions(params.id)),
      context.queryClient.fetchQuery(collectionPermissionsQueryOptions(params.id)),
      context.queryClient.fetchQuery(indicateursAllQueryOptions()),
      context.queryClient.fetchQuery(utilisateursAllQueryOptions()),
    ])
  },
  component: EditCollectionComponent,
})

function EditCollectionComponent() {
  const { id } = Route.useParams()
  const { onglet } = Route.useSearch()
  const navigate = useNavigate({ from: Route.fullPath })

  const { data: collection } = useSuspenseQuery(collectionQueryOptions(id))
  const { data: permissions } = useSuspenseQuery(collectionPermissionsQueryOptions(id))

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

      <Tabs
        value={onglet}
        onValueChange={(valeur) => {
          void navigate({
            search: (prev) => ({ ...prev, onglet: valeur as typeof onglet }),
            replace: true,
          })
        }}
      >
        <TabsList className="mb-6">
          <TabsTrigger value="details">Détails</TabsTrigger>
          <TabsTrigger value="indicateurs">
            Indicateurs ({collection.indicateurs.length})
          </TabsTrigger>
          <TabsTrigger value="acces">Accès ({permissions.items.length})</TabsTrigger>
          <TabsTrigger value="responsables">
            Responsables ({collection.responsables.length})
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {onglet === 'details' ? <CollectionDetails collectionId={id} /> : null}

      {onglet === 'indicateurs' ? <CollectionIndicateurs collectionId={id} /> : null}

      {onglet === 'acces' ? <CollectionAcces collectionId={id} /> : null}

      {onglet === 'responsables' ? <CollectionResponsables collectionId={id} /> : null}
    </div>
  )
}
