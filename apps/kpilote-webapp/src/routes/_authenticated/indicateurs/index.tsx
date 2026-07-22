import { useSuspenseQueries, useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { startTransition } from 'react'
import { z } from 'zod'

import { DashboardSwitch } from '@/components/DashboardSwitch'
import { RouteError } from '@/components/RouteError'
import { RouteLoading } from '@/components/RouteLoading'
import { IndicateurCard } from '@/components/indicateurs/IndicateurCard'
import { IndividusSelectorBar } from '@/components/indicateurs/IndividusSelectorBar'
import { CardGrid } from '@pilote/kpilote-ui/CardGrid'
import { EmptyState } from '@pilote/kpilote-ui/EmptyState'
import { Page } from '@pilote/kpilote-ui/Page'
import { Text } from '@pilote/kpilote-ui/Typography'
import {
  buildOrderedNodes,
  filterGroupsForReferentiels,
  groupNodesByRootReferentiel,
  resolveIndividuForIndicateur,
} from '@/lib/individus/hierarchy'
import { parseIndividusParam, serializeIndividusParam } from '@/lib/individus/selection'
import { DEFAULT_PAGE_SIZE_OPTIONS, Pagination } from '@pilote/kpilote-ui/Pagination'
import { indicateursQueryOptions, loadIndicateurs } from '@/queries/indicateurs'
import {
  pertinentReferentielsQueryOptions,
  referentielIndividusQueryOptions,
} from '@/queries/referentiels'

const indicateursSearchSchema = z.object({
  cursor: z.string().optional(),
  pageSize: z.coerce.number().int().min(1).max(100).optional(),
  individus: z.string().optional(),
})

const PERTINENT_SCOPE = 'me'

export const Route = createFileRoute('/_authenticated/indicateurs/')({
  validateSearch: indicateursSearchSchema,
  loaderDeps: ({ search }) => search,
  loader: async ({ context, deps }) => {
    const { queryClient } = context
    const referentiels = await queryClient.ensureQueryData(
      pertinentReferentielsQueryOptions(PERTINENT_SCOPE),
    )
    await Promise.all(
      referentiels.map((r) => queryClient.ensureQueryData(referentielIndividusQueryOptions(r.id))),
    )

    return loadIndicateurs({
      queryClient,
      query: { cursor: deps.cursor, pageSize: deps.pageSize },
    })
  },
  pendingComponent: () => <RouteLoading message="Chargement des indicateurs…" />,
  errorComponent: RouteError,
  component: IndicateursListComponent,
})

function IndicateursListComponent() {
  const search = Route.useSearch()
  const navigate = useNavigate({ from: Route.fullPath })
  const { data } = useSuspenseQuery(
    indicateursQueryOptions({ cursor: search.cursor, pageSize: search.pageSize }),
  )
  const { data: referentiels } = useSuspenseQuery(
    pertinentReferentielsQueryOptions(PERTINENT_SCOPE),
  )
  const referentielIds = referentiels.map((r) => r.id)
  const individusByReferentiel = useSuspenseQueries({
    queries: referentielIds.map((refId) => referentielIndividusQueryOptions(refId)),
    combine: (results) => results.map((r) => r.data),
  })

  const referentielsById = new Map(referentiels.map((r) => [r.id, r] as const))
  const nodes = buildOrderedNodes(
    individusByReferentiel.flatMap((batch) => [...batch]),
    referentielsById,
  )
  const groups = filterGroupsForReferentiels(groupNodesByRootReferentiel(nodes), referentielIds)
  const selected = parseIndividusParam(search.individus)

  const onSelect = (rootReferentielId: string, individuId: string) => {
    const next = new Map(selected)
    next.set(rootReferentielId, individuId)
    startTransition(() => {
      void navigate({
        search: (prev) => ({ ...prev, individus: serializeIndividusParam(next) }),
      })
    })
  }

  return (
    <Page
      title="Tableau de bord"
      description="Consultez et gérez l'ensemble de vos indicateurs par valeur ou par dossier."
      stickybar={
        <>
          <IndividusSelectorBar groups={groups} selected={selected} onSelect={onSelect} />
          <DashboardSwitch />
        </>
      }
    >
      <div className="flex flex-col gap-6">
        <Text as="span" variant="kicker" tone="muted">
          {data.total} indicateur{data.total > 1 ? 's' : ''}
        </Text>

        {data.items.length === 0 ? (
          <EmptyState title="Aucun indicateur disponible." />
        ) : (
          <CardGrid>
            {data.items.map((indicateur) => {
              const resolved = resolveIndividuForIndicateur({
                indicateurReferentielIds: indicateur.referentiels.map((r) => r.id),
                selectedByRoot: selected,
                groups,
              })
              return (
                <IndicateurCard
                  key={indicateur.id}
                  indicateur={indicateur}
                  {...(resolved
                    ? {
                        context: {
                          individu: resolved.individu.id,
                          referentiel: resolved.referentiel.id,
                        },
                      }
                    : {})}
                />
              )
            })}
          </CardGrid>
        )}

        <Pagination
          hasNext={data.pagination.hasMore}
          onNext={() => {
            const next = data.pagination.cursor
            if (next) void navigate({ search: (prev) => ({ ...prev, cursor: next }) })
          }}
          pageSize={search.pageSize ?? DEFAULT_PAGE_SIZE_OPTIONS[0]}
          onPageSizeChange={(pageSize) => {
            void navigate({ search: (prev) => ({ ...prev, pageSize, cursor: undefined }) })
          }}
        />
      </div>
    </Page>
  )
}
