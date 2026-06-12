import { useInfiniteQuery } from '@tanstack/react-query'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { Plus, Search } from 'lucide-react'
import { useState } from 'react'

import { Breadcrumb } from '@/components/Breadcrumb'
import { PageHeading } from '@/components/PageHeading'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { Table } from '@/components/ui/Table'
import { clickableRowProps } from '@/lib/clickableRow'
import { indicateursInfiniteQueryOptions } from '@/queries/indicateurs'
import { session } from '@/session'

export const Route = createFileRoute('/_authed/indicateurs/')({
  component: IndicateursListComponent,
})

const VISIBILITE_BADGE: Record<string, string> = {
  PUBLIC: 'bg-[#e8f5ec] text-[#18753c]',
  PRIVE: 'bg-[#f0eefb] text-[#5246a8]',
}

function IndicateursListComponent() {
  const navigate = useNavigate()
  const isProd = session.current?.environment === 'prod'
  const [recherche, setRecherche] = useState('')
  const query = useInfiniteQuery(indicateursInfiniteQueryOptions(recherche))
  const items = query.data?.pages.flatMap((page) => page.items) ?? []
  const total = query.data?.pages[0]?.total ?? 0

  return (
    <div>
      <Breadcrumb>
        <Link to="/fonctionnalites" className="hover:text-primary">
          Fonctionnalités
        </Link>
        <span className="font-medium text-text">Indicateurs</span>
      </Breadcrumb>
      <PageHeading
        title="Indicateurs"
        subtitle={
          <>
            {total} indicateur{total > 1 ? 's' : ''} · environnement{' '}
            <b className={isProd ? 'text-accent' : undefined}>{session.current?.environment}</b>
          </>
        }
        action={
          <Button asChild>
            <Link to="/indicateurs/nouveau">
              <Plus className="size-4" /> Créer un indicateur
            </Link>
          </Button>
        }
      />

      <div className="mb-4 flex max-w-sm items-center gap-2 rounded-md border border-border px-3 py-2 text-sm">
        <Search className="size-4 text-text-subtle" />
        <input
          value={recherche}
          onChange={(event) => setRecherche(event.target.value)}
          placeholder="Rechercher un indicateur…"
          className="w-full bg-transparent focus:outline-none"
        />
      </div>

      {items.length === 0 && !query.isLoading ? (
        <EmptyState title="Aucun indicateur" description="Créez votre premier indicateur." />
      ) : (
        <Table>
          <Table.Head>
            <Table.Row>
              <Table.HeaderCell>ID</Table.HeaderCell>
              <Table.HeaderCell>Nom</Table.HeaderCell>
              <Table.HeaderCell>Visibilité</Table.HeaderCell>
              <Table.HeaderCell>Unité</Table.HeaderCell>
              <Table.HeaderCell align="center">Référentiels</Table.HeaderCell>
              <Table.HeaderCell />
            </Table.Row>
          </Table.Head>
          <Table.Body>
            {items.map((indicateur) => (
              <Table.Row
                key={indicateur.id}
                {...clickableRowProps(
                  () => void navigate({ to: '/indicateurs/$id', params: { id: indicateur.id } }),
                )}
              >
                <Table.Cell>
                  <span className="font-mono text-primary">{indicateur.id}</span>
                </Table.Cell>
                <Table.Cell>
                  <span className="font-semibold">{indicateur.nom}</span>
                </Table.Cell>
                <Table.Cell>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-semibold ${VISIBILITE_BADGE[indicateur.visibilite]}`}
                  >
                    {indicateur.visibilite}
                  </span>
                </Table.Cell>
                <Table.Cell>{indicateur.unite?.libelle ?? '—'}</Table.Cell>
                <Table.Cell align="center">{indicateur.referentiels.length}</Table.Cell>
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
