import { useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router'
import { startTransition } from 'react'
import { z } from 'zod'
import { joinCsv, splitCsv } from '@pilote/kpilote-shared/texte'

import { analyticsEvents } from '@pilote/kpilote-shared/analytics/events'
import { DashboardSwitch } from '@/components/DashboardSwitch'
import { analytics } from '@/analytics/tracker'
import { RouteError } from '@/components/RouteError'
import { RouteLoading } from '@/components/RouteLoading'
import { IndicateurCard } from '@/components/indicateurs/IndicateurCard'
import { IndividuSelectors } from '@/components/indicateurs/IndividuSelectors'
import { CardGrid } from '@pilote/kpilote-ui/CardGrid'
import { EmptyState } from '@pilote/kpilote-ui/EmptyState'
import { Page } from '@pilote/kpilote-ui/Page'
import { Text } from '@pilote/kpilote-ui/Typography'
import { ensureSelectionIndividus } from '@/lib/individus/ensureSelection'
import { resolveIndicateurReading, selectIndividu } from '@/lib/individus/selection'
import { DEFAULT_PAGE_SIZE, Pagination } from '@pilote/kpilote-ui/Pagination'
import { indicateursQueryOptions, loadIndicateurs } from '@/queries/indicateurs'
import {
  allReferentielsQueryOptions,
  loadAllReferentielIds,
  useIndividuHierarchy,
} from '@/queries/referentiels'

const indicateursSearchSchema = z.object({
  cursor: z.string().optional(),
  pageSize: z.coerce.number().int().min(1).max(100).optional(),
  // Sélection d'individus, un par stack de référentiels (`DEPT-84,BV-05`).
  selectedIndividus: z.string().optional(),
})

type IndicateursSearch = z.infer<typeof indicateursSearchSchema>

const toIndicateursQuery = (search: IndicateursSearch) => ({
  ...search,
  pageSize: search.pageSize ?? DEFAULT_PAGE_SIZE,
})

export const Route = createFileRoute('/_authenticated/indicateurs/')({
  staticData: { title: 'Indicateurs' },
  validateSearch: indicateursSearchSchema,
  loaderDeps: ({ search }) => search,
  loader: async ({ context, deps }) => {
    const { queryClient } = context
    const referentielIds = await loadAllReferentielIds({ queryClient })
    await ensureSelectionIndividus({
      queryClient,
      referentielIds,
      selectedIndividus: deps.selectedIndividus,
      onChange: (selectedIndividus) => {
        throw redirect({
          to: '/indicateurs',
          search: { ...deps, selectedIndividus },
          replace: true,
        })
      },
    })

    return loadIndicateurs({ queryClient, query: toIndicateursQuery(deps) })
  },
  pendingComponent: () => <RouteLoading message="Chargement des indicateurs…" />,
  errorComponent: RouteError,
  component: IndicateursListComponent,
})

function IndicateursListComponent() {
  const search = Route.useSearch()
  const navigate = useNavigate({ from: Route.fullPath })
  const { data } = useSuspenseQuery(indicateursQueryOptions(toIndicateursQuery(search)))
  const { data: referentiels } = useSuspenseQuery(allReferentielsQueryOptions)
  const referentielIds = referentiels.map((r) => r.id)
  const { nodes, groups } = useIndividuHierarchy(referentielIds)
  const selection = splitCsv(search.selectedIndividus)

  return (
    <Page
      title="Tableau de bord"
      description="Consultez et gérez l'ensemble de vos indicateurs par valeur ou par collection."
      stickybar={
        <>
          <IndividuSelectors
            groups={groups}
            selection={selection}
            onSelect={({ individu, referentiel }) => {
              analytics.trackEvent(
                analyticsEvents.dashboard.individuChange({ referentiel_id: referentiel }),
              )
              const selectedIndividus = joinCsv(selectIndividu({ selection, groups, individu }))
              startTransition(() => {
                void navigate({ search: (prev) => ({ ...prev, selectedIndividus }) })
              })
            }}
          />
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
            {data.items.map((indicateur) => (
              <IndicateurCard
                key={indicateur.id}
                indicateur={indicateur}
                source="dashboard"
                reading={resolveIndicateurReading({
                  selection,
                  nodes,
                  referentielIds: indicateur.referentiels.map((ref) => ref.id),
                })}
              />
            ))}
          </CardGrid>
        )}

        <Pagination
          hasNext={data.pagination.hasMore}
          onNext={() => {
            const next = data.pagination.cursor
            if (!next) return
            analytics.trackEvent(
              analyticsEvents.dashboard.paginationNext({
                entity_type: 'indicateur',
                page_size: search.pageSize ?? DEFAULT_PAGE_SIZE,
              }),
            )
            void navigate({ search: (prev) => ({ ...prev, cursor: next }) })
          }}
          pageSize={search.pageSize ?? DEFAULT_PAGE_SIZE}
          onPageSizeChange={(pageSize) => {
            analytics.trackEvent(
              analyticsEvents.dashboard.paginationSize({
                entity_type: 'indicateur',
                page_size: pageSize,
              }),
            )
            void navigate({ search: (prev) => ({ ...prev, pageSize, cursor: undefined }) })
          }}
        />
      </div>
    </Page>
  )
}
