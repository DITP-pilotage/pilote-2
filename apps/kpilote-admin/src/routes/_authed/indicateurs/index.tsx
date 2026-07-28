import type { IndicateurVisibilite } from '@pilote/kpilote-shared/indicateur'
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
import { indicateursInfiniteQueryOptions } from '@/queries/indicateurs'
import { session } from '@/session'

export const Route = createFileRoute('/_authed/indicateurs/')({
  component: IndicateursListComponent,
})

const VISIBILITE_TONE = {
  PUBLIC: 'success',
  PRIVE: 'neutral',
} as const satisfies Record<IndicateurVisibilite, ComponentProps<typeof Pill>['tone']>

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
            <b className={isProd ? 'text-red-marianne' : undefined}>
              {session.current?.environment}
            </b>
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

      <div className="mb-4">
        <SearchField
          label="Rechercher un indicateur"
          placeholder="Rechercher un indicateur…"
          value={recherche}
          onChange={setRecherche}
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
                  <Pill tone={VISIBILITE_TONE[indicateur.visibilite]}>{indicateur.visibilite}</Pill>
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
