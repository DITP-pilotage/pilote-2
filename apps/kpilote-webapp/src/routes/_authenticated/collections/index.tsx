import { individuPublicIdSchema } from '@pilote/kpilote-shared/individu'
import { referentielPublicIdSchema } from '@pilote/kpilote-shared/referentiel'
import { useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router'
import { startTransition } from 'react'
import { z } from 'zod'

import { DashboardSwitch } from '@/components/DashboardSwitch'
import { RouteError } from '@/components/RouteError'
import { RouteLoading } from '@/components/RouteLoading'
import { CollectionCard } from '@/components/collections/CollectionCard'
import { FieldIndividuSelect } from '@/components/indicateurs/FieldIndividuSelect'
import { CardGrid } from '@pilote/kpilote-ui/CardGrid'
import { EmptyState } from '@pilote/kpilote-ui/EmptyState'
import { Page } from '@pilote/kpilote-ui/Page'
import { DEFAULT_PAGE_SIZE_OPTIONS, Pagination } from '@pilote/kpilote-ui/Pagination'
import { Text } from '@pilote/kpilote-ui/Typography'
import { ensureIndividuReferentielPair } from '@/lib/individus/pair'
import { loadCollections, collectionsQueryOptions } from '@/queries/collections'
import { allReferentielsQueryOptions, loadAllReferentielIds } from '@/queries/referentiels'

const collectionsSearchSchema = z.object({
  cursor: z.string().optional(),
  pageSize: z.coerce.number().int().min(1).max(100).optional(),
  individu: individuPublicIdSchema.optional(),
  referentiel: referentielPublicIdSchema.optional(),
})

export const Route = createFileRoute('/_authenticated/collections/')({
  validateSearch: collectionsSearchSchema,
  loaderDeps: ({ search }) => search,
  loader: async ({ context, deps }) => {
    const { queryClient } = context
    const referentielIds = await loadAllReferentielIds({ queryClient })
    await ensureIndividuReferentielPair({
      queryClient,
      referentielIds,
      deps,
      onMismatch: ({ individu, referentiel }) => {
        throw redirect({
          to: '/collections',
          search: { ...deps, individu, referentiel },
          replace: true,
        })
      },
    })

    return loadCollections({
      queryClient,
      query: { cursor: deps.cursor, pageSize: deps.pageSize },
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
    collectionsQueryOptions({ cursor: search.cursor, pageSize: search.pageSize }),
  )
  const { data: referentiels } = useSuspenseQuery(allReferentielsQueryOptions)
  const referentielIds = referentiels.map((r) => r.id)

  const cardContext =
    search.individu && search.referentiel
      ? { individu: search.individu, referentiel: search.referentiel }
      : undefined

  return (
    <Page
      title="Tableau de bord"
      description="Consultez et gérez l'ensemble de vos indicateurs par valeur ou par collection."
      stickybar={
        <>
          {search.individu ? (
            <div>
              <FieldIndividuSelect
                referentielIds={referentielIds}
                value={search.individu}
                onChange={({ individu, referentiel }) => {
                  startTransition(() => {
                    void navigate({
                      search: (prev) => ({ ...prev, individu, referentiel }),
                    })
                  })
                }}
              />
            </div>
          ) : (
            <div />
          )}
          <DashboardSwitch />
        </>
      }
    >
      <div className="flex flex-col gap-6">
        <Text as="span" variant="kicker" tone="muted">
          {data.total} collection{data.total > 1 ? 's' : ''}
        </Text>

        {data.items.length === 0 ? (
          <EmptyState title="Aucun collection disponible" />
        ) : (
          <CardGrid>
            {data.items.map((collection) => (
              <CollectionCard key={collection.id} collection={collection} context={cardContext} />
            ))}
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
