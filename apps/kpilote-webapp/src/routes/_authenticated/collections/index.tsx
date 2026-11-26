import { useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router'
import { startTransition } from 'react'
import { z } from 'zod'
import { joinCsv, splitCsv } from '@pilote/kpilote-shared/texte'

import { analyticsEvents } from '@pilote/kpilote-shared/analytics/events'
import { DashboardStickybar } from '@/components/DashboardStickybar'
import { DashboardSwitch } from '@/components/DashboardSwitch'
import { analytics } from '@/analytics/tracker'
import { RouteError } from '@/components/RouteError'
import { RouteLoading } from '@/components/RouteLoading'
import { CollectionCard } from '@/components/collections/CollectionCard'
import { CardGrid } from '@pilote/kpilote-ui/CardGrid'
import { EmptyState } from '@pilote/kpilote-ui/EmptyState'
import { Page } from '@pilote/kpilote-ui/Page'
import { DEFAULT_PAGE_SIZE, Pagination } from '@pilote/kpilote-ui/Pagination'
import { Text } from '@pilote/kpilote-ui/Typography'
import { ensureSelectionIndividus } from '@/lib/individus/ensureSelection'
import { resolveCollectionReading } from '@/lib/individus/selection'
import { loadCollections, collectionsQueryOptions } from '@/queries/collections'
import {
  allReferentielsQueryOptions,
  loadAllReferentielIds,
  useIndividuHierarchy,
} from '@/queries/referentiels'

const collectionsSearchSchema = z.object({
  cursor: z.string().optional(),
  pageSize: z.coerce.number().int().min(1).max(100).optional(),
  // Sélection d'individus, un par stack de référentiels (`DEPT-84,BV-05`).
  selectedIndividus: z.string().optional(),
})

export const Route = createFileRoute('/_authenticated/collections/')({
  staticData: { title: 'Collections' },
  validateSearch: collectionsSearchSchema,
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
          to: '/collections',
          search: { ...deps, selectedIndividus },
          replace: true,
        })
      },
    })

    return loadCollections({
      queryClient,
      query: { cursor: deps.cursor, pageSize: deps.pageSize ?? DEFAULT_PAGE_SIZE },
    })
  },
  pendingComponent: () => <RouteLoading message="Chargement des collections…" />,
  errorComponent: RouteError,
  component: CollectionsListComponent,
})

function CollectionsListComponent() {
  const search = Route.useSearch()
  const navigate = useNavigate({ from: Route.fullPath })
  const { data } = useSuspenseQuery(
    collectionsQueryOptions({
      cursor: search.cursor,
      pageSize: search.pageSize ?? DEFAULT_PAGE_SIZE,
    }),
  )
  const { data: referentiels } = useSuspenseQuery(allReferentielsQueryOptions)
  const referentielIds = referentiels.map((r) => r.id)
  const { groups } = useIndividuHierarchy(referentielIds)
  const selection = splitCsv(search.selectedIndividus)

  const reading = resolveCollectionReading({ selection })

  return (
    <Page
      title="Tableau de bord"
      description="Consultez et gérez vos indicateurs par valeur ou par collection."
      stickybar={
        <DashboardStickybar
          groups={groups}
          selection={selection}
          onSelectionChange={(next) => {
            // Le curseur ne vaut que pour la sélection qui l'a produit.
            const selectedIndividus = joinCsv(next)
            startTransition(() => {
              void navigate({
                search: (prev) => ({ ...prev, selectedIndividus, cursor: undefined }),
              })
            })
          }}
        />
      }
    >
      <div>
        <DashboardSwitch />
      </div>

      <div className="flex flex-col gap-6">
        <Text as="span" variant="kicker" tone="muted">
          {data.total} collection{data.total > 1 ? 's' : ''}
        </Text>

        {data.items.length === 0 ? (
          <EmptyState title="Aucune collection disponible" />
        ) : (
          <CardGrid>
            {data.items.map((collection) => (
              <CollectionCard
                key={collection.id}
                collection={collection}
                reading={reading}
                source="dashboard"
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
                entity_type: 'collection',
                page_size: search.pageSize ?? DEFAULT_PAGE_SIZE,
              }),
            )
            void navigate({ search: (prev) => ({ ...prev, cursor: next }) })
          }}
          pageSize={search.pageSize ?? DEFAULT_PAGE_SIZE}
          onPageSizeChange={(pageSize) => {
            analytics.trackEvent(
              analyticsEvents.dashboard.paginationSize({
                entity_type: 'collection',
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
