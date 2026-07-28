import type { CollectionVisibilite } from '@pilote/kpilote-shared/collection'
import { useInfiniteQuery } from '@tanstack/react-query'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { Plus } from 'lucide-react'
import { useState, type ComponentProps } from 'react'

import { Breadcrumb } from '@/components/Breadcrumb'
import { PageHeading } from '@/components/PageHeading'
import { Button } from '@pilote/kpilote-ui/Button'
import { EmptyState } from '@pilote/kpilote-ui/EmptyState'
import { Pill } from '@pilote/kpilote-ui/Pill'
import { SearchField } from '@pilote/kpilote-ui/SearchField'
import { Table } from '@pilote/kpilote-ui/Table'
import { clickableRowProps } from '@/lib/clickableRow'
import { collectionsInfiniteQueryOptions } from '@/queries/collections'
import { session } from '@/session'

export const Route = createFileRoute('/_authed/collections/')({
  component: CollectionsListComponent,
})

const VISIBILITE_TONE = {
  PUBLIC: 'success',
  PRIVE: 'neutral',
} as const satisfies Record<CollectionVisibilite, ComponentProps<typeof Pill>['tone']>

function CollectionsListComponent() {
  const navigate = useNavigate()
  const isProd = session.current?.environment === 'prod'
  const [recherche, setRecherche] = useState('')
  const query = useInfiniteQuery(collectionsInfiniteQueryOptions(recherche))
  const items = query.data?.pages.flatMap((page) => page.items) ?? []
  const total = query.data?.pages[0]?.total ?? 0

  return (
    <div>
      <Breadcrumb>
        <Link to="/fonctionnalites" className="hover:text-primary">
          Fonctionnalités
        </Link>
        <span className="font-medium text-text">Collections</span>
      </Breadcrumb>
      <PageHeading
        title="Collections"
        subtitle={
          <>
            {total} collection{total > 1 ? 's' : ''} · environnement{' '}
            <b className={isProd ? 'text-red-marianne' : undefined}>
              {session.current?.environment}
            </b>
          </>
        }
        action={
          <Button asChild>
            <Link to="/collections/nouveau">
              <Plus className="size-4" /> Créer une collection
            </Link>
          </Button>
        }
      />

      <div className="mb-4">
        <SearchField
          label="Rechercher une collection"
          placeholder="Rechercher une collection…"
          value={recherche}
          onChange={setRecherche}
        />
      </div>

      {items.length === 0 && !query.isLoading ? (
        <EmptyState title="Aucune collection" description="Créez votre première collection." />
      ) : (
        <Table>
          <Table.Head>
            <Table.Row>
              <Table.HeaderCell>ID</Table.HeaderCell>
              <Table.HeaderCell>Nom</Table.HeaderCell>
              <Table.HeaderCell>Visibilité</Table.HeaderCell>
              <Table.HeaderCell align="center">Indicateurs</Table.HeaderCell>
              <Table.HeaderCell align="center">Responsables</Table.HeaderCell>
              <Table.HeaderCell />
            </Table.Row>
          </Table.Head>
          <Table.Body>
            {items.map((collection) => (
              <Table.Row
                key={collection.id}
                {...clickableRowProps(
                  () => void navigate({ to: '/collections/$id', params: { id: collection.id } }),
                )}
              >
                <Table.Cell>
                  <span className="font-mono text-primary">{collection.id}</span>
                </Table.Cell>
                <Table.Cell>
                  <span className="font-semibold">{collection.nom}</span>
                </Table.Cell>
                <Table.Cell>
                  <Pill tone={VISIBILITE_TONE[collection.visibilite]}>{collection.visibilite}</Pill>
                </Table.Cell>
                <Table.Cell align="center">{collection.indicateurs.length}</Table.Cell>
                <Table.Cell align="center">{collection.responsables.length}</Table.Cell>
                <Table.Cell align="right">
                  <span className="text-primary">→</span>
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table>
      )}

      {query.hasNextPage ? (
        <div className="mt-4 flex justify-center">
          <Button
            variant="secondary"
            type="button"
            disabled={query.isFetchingNextPage}
            onClick={() => void query.fetchNextPage()}
          >
            {query.isFetchingNextPage ? 'Chargement…' : 'Charger plus'}
          </Button>
        </div>
      ) : null}
    </div>
  )
}
