import { searchUnaccent } from '@pilote/kpilote-shared/texte'
import { useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { Plus } from 'lucide-react'
import { useState } from 'react'

import { Breadcrumb } from '@/components/Breadcrumb'
import { PageHeading } from '@/components/PageHeading'
import { useAppConfig } from '@/context/AppConfigContext'
import { clickableRowProps } from '@/lib/clickableRow'
import { dimensionsAllQueryOptions } from '@/queries/dimensions'
import { Button } from '@pilote/kpilote-ui/Button'
import { EmptyState } from '@pilote/kpilote-ui/EmptyState'
import { SearchField } from '@pilote/kpilote-ui/SearchField'
import { Table } from '@pilote/kpilote-ui/Table'

export const Route = createFileRoute('/_authed/dimensions/')({
  loader: ({ context }) => context.queryClient.fetchQuery(dimensionsAllQueryOptions()),
  component: DimensionsListComponent,
})

function DimensionsListComponent() {
  const navigate = useNavigate()
  const { isProd, environment } = useAppConfig()
  const { data: dimensions } = useSuspenseQuery(dimensionsAllQueryOptions())
  const [recherche, setRecherche] = useState('')

  const terme = searchUnaccent(recherche)
  const items = terme
    ? dimensions.filter((dimension) =>
        searchUnaccent(`${dimension.id} ${dimension.nom}`).includes(terme),
      )
    : dimensions
  const total = dimensions.length

  return (
    <div>
      <Breadcrumb>
        <Link to="/fonctionnalites" className="hover:text-primary">
          Fonctionnalités
        </Link>
        <span className="font-medium text-text">Dimensions</span>
      </Breadcrumb>
      <PageHeading
        title="Dimensions"
        subtitle={
          <>
            {total} dimension{total > 1 ? 's' : ''} · environnement{' '}
            <b className={isProd ? 'text-red-marianne' : undefined}>{environment}</b>
          </>
        }
        action={
          <Button asChild>
            <Link to="/dimensions/nouveau">
              <Plus className="size-4" /> Créer une dimension
            </Link>
          </Button>
        }
      />

      <div className="mb-4">
        <SearchField
          label="Rechercher une dimension"
          placeholder="Rechercher une dimension…"
          value={recherche}
          onChange={setRecherche}
        />
      </div>

      {items.length === 0 ? (
        <EmptyState
          title={terme ? 'Aucun résultat' : 'Aucune dimension'}
          description={
            terme
              ? 'Aucune dimension ne correspond à cette recherche.'
              : 'Créez votre première dimension.'
          }
        />
      ) : (
        <Table>
          <Table.Head>
            <Table.Row>
              <Table.HeaderCell>ID</Table.HeaderCell>
              <Table.HeaderCell>Nom</Table.HeaderCell>
              <Table.HeaderCell>Niveaux</Table.HeaderCell>
              <Table.HeaderCell />
            </Table.Row>
          </Table.Head>
          <Table.Body>
            {items.map((dimension) => (
              <Table.Row
                key={dimension.id}
                {...clickableRowProps(
                  () => void navigate({ to: '/dimensions/$id', params: { id: dimension.id } }),
                )}
              >
                <Table.Cell>
                  <span className="font-mono text-primary">{dimension.id}</span>
                </Table.Cell>
                <Table.Cell>
                  <span className="font-semibold">{dimension.nom}</span>
                </Table.Cell>
                <Table.Cell>
                  <span className="font-mono text-xs text-text-muted">
                    {dimension.referentiels.length > 0 ? dimension.referentiels.join(', ') : '—'}
                  </span>
                </Table.Cell>
                <Table.Cell align="right">
                  <span className="text-primary">→</span>
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table>
      )}
    </div>
  )
}
