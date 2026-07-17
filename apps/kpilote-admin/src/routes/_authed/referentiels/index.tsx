import { useInfiniteQuery } from '@tanstack/react-query'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { Plus, Search } from 'lucide-react'
import { useState } from 'react'

import { Breadcrumb } from '@/components/Breadcrumb'
import { PageHeading } from '@/components/PageHeading'
import { Button } from '@pilote/kpilote-ui/Button'
import { EmptyState } from '@pilote/kpilote-ui/EmptyState'
import { Table } from '@pilote/kpilote-ui/Table'
import { clickableRowProps } from '@/lib/clickableRow'
import { referentielsInfiniteQueryOptions } from '@/queries/referentiels'
import { useAppConfig } from '@/context/AppConfigContext'

export const Route = createFileRoute('/_authed/referentiels/')({
  component: ReferentielsListComponent,
})

function ReferentielsListComponent() {
  const navigate = useNavigate()
  const { isProd, environment } = useAppConfig()
  const [recherche, setRecherche] = useState('')
  const query = useInfiniteQuery(referentielsInfiniteQueryOptions(recherche))
  const items = query.data?.pages.flatMap((page) => page.items) ?? []
  const total = query.data?.pages[0]?.total ?? 0

  return (
    <div>
      <Breadcrumb>
        <Link to="/fonctionnalites" className="hover:text-primary">
          Fonctionnalités
        </Link>
        <span className="font-medium text-text">Référentiels</span>
      </Breadcrumb>
      <PageHeading
        title="Référentiels"
        subtitle={
          <>
            {total} référentiel{total > 1 ? 's' : ''} · environnement{' '}
            <b className={isProd ? 'text-red-marianne' : undefined}>{environment}</b>
          </>
        }
        action={
          <Button asChild>
            <Link to="/referentiels/nouveau">
              <Plus className="size-4" /> Créer un référentiel
            </Link>
          </Button>
        }
      />

      <div className="mb-4 flex max-w-sm items-center gap-2 rounded-md border border-border px-3 py-2 text-sm">
        <Search className="size-4 text-text-subtle" />
        <input
          value={recherche}
          onChange={(event) => setRecherche(event.target.value)}
          placeholder="Rechercher un référentiel…"
          className="w-full bg-transparent focus:outline-none"
        />
      </div>

      {items.length === 0 && !query.isLoading ? (
        <EmptyState title="Aucun référentiel" description="Créez votre premier référentiel." />
      ) : (
        <Table>
          <Table.Head>
            <Table.Row>
              <Table.HeaderCell>ID</Table.HeaderCell>
              <Table.HeaderCell>Nom</Table.HeaderCell>
              <Table.HeaderCell>Description</Table.HeaderCell>
              <Table.HeaderCell align="center">Individus</Table.HeaderCell>
              <Table.HeaderCell />
            </Table.Row>
          </Table.Head>
          <Table.Body>
            {items.map((referentiel) => (
              <Table.Row
                key={referentiel.id}
                {...clickableRowProps(
                  () => void navigate({ to: '/referentiels/$id', params: { id: referentiel.id } }),
                )}
              >
                <Table.Cell>
                  <span className="font-mono text-primary">{referentiel.id}</span>
                </Table.Cell>
                <Table.Cell>
                  <span className="font-semibold">{referentiel.nom}</span>
                </Table.Cell>
                <Table.Cell>
                  <span className="text-text-muted">{referentiel.description ?? '—'}</span>
                </Table.Cell>
                <Table.Cell align="center">{referentiel.nombreIndividus}</Table.Cell>
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
