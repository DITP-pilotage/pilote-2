import { useInfiniteQuery } from '@tanstack/react-query'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { Plus } from 'lucide-react'
import { useState } from 'react'

import { Breadcrumb } from '@/components/Breadcrumb'
import { PageHeading } from '@/components/PageHeading'
import { Button } from '@pilote/kpilote-ui/Button'
import { EmptyState } from '@pilote/kpilote-ui/EmptyState'
import { SearchField } from '@pilote/kpilote-ui/SearchField'
import { Table } from '@pilote/kpilote-ui/Table'
import { clickableRowProps } from '@/lib/clickableRow'
import { axesInfiniteQueryOptions } from '@/queries/axes'
import { useAppConfig } from '@/context/AppConfigContext'

export const Route = createFileRoute('/_authed/axes/')({
  component: AxesListComponent,
})

function AxesListComponent() {
  const navigate = useNavigate()
  const { isProd, environment } = useAppConfig()
  const [recherche, setRecherche] = useState('')
  const query = useInfiniteQuery(axesInfiniteQueryOptions(recherche))
  const items = query.data?.pages.flatMap((page) => page.items) ?? []
  const total = query.data?.pages[0]?.total ?? 0

  return (
    <div>
      <Breadcrumb>
        <Link to="/fonctionnalites" className="hover:text-primary">
          Fonctionnalités
        </Link>
        <span className="font-medium text-text">Axes</span>
      </Breadcrumb>
      <PageHeading
        title="Axes"
        subtitle={
          <>
            {total} axe{total > 1 ? 's' : ''} · environnement{' '}
            <b className={isProd ? 'text-red-marianne' : undefined}>{environment}</b>
          </>
        }
        action={
          <Button asChild>
            <Link to="/axes/nouveau">
              <Plus className="size-4" /> Créer un axe
            </Link>
          </Button>
        }
      />

      <div className="mb-4">
        <SearchField
          label="Rechercher un axe"
          placeholder="Rechercher un axe…"
          value={recherche}
          onChange={setRecherche}
        />
      </div>

      {items.length === 0 && !query.isLoading ? (
        <EmptyState
          title="Aucun axe"
          description="Un axe découpe les valeurs d’un indicateur en plus du territoire (ex. Opérateur)."
        />
      ) : (
        <Table>
          <Table.Head>
            <Table.Row>
              <Table.HeaderCell>ID</Table.HeaderCell>
              <Table.HeaderCell>Nom</Table.HeaderCell>
              <Table.HeaderCell>Niveaux</Table.HeaderCell>
              <Table.HeaderCell align="center">Modalités</Table.HeaderCell>
              <Table.HeaderCell />
            </Table.Row>
          </Table.Head>
          <Table.Body>
            {items.map((axe) => (
              <Table.Row
                key={axe.id}
                {...clickableRowProps(
                  () => void navigate({ to: '/axes/$id', params: { id: axe.id } }),
                )}
              >
                <Table.Cell>
                  <span className="font-mono text-primary">{axe.id}</span>
                </Table.Cell>
                <Table.Cell>
                  <span className="font-semibold">{axe.nom}</span>
                </Table.Cell>
                <Table.Cell>
                  <span className="text-text-muted">
                    {axe.niveaux.map((niveau) => niveau.nom).join(' → ')}
                  </span>
                </Table.Cell>
                <Table.Cell align="center">{axe.nombreModalites}</Table.Cell>
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
