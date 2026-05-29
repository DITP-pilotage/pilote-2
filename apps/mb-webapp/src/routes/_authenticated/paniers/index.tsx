import { useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { z } from 'zod'

import { RouteError } from '@/components/RouteError'
import { RouteLoading } from '@/components/RouteLoading'
import { PanierCard } from '@/components/paniers/PanierCard'
import { CardGrid } from '@/components/ui/CardGrid'
import { EmptyState } from '@/components/ui/EmptyState'
import { Page } from '@/components/ui/Page'
import { DEFAULT_PAGE_SIZE_OPTIONS, Pagination } from '@/components/ui/Pagination'
import { Section } from '@/components/ui/Section'
import { Text } from '@/components/ui/Typography'
import { loadPaniers, paniersQueryOptions } from '@/queries/paniers'

const paniersSearchSchema = z.object({
  cursor: z.string().optional(),
  pageSize: z.coerce.number().int().min(1).max(100).optional(),
})

export const Route = createFileRoute('/_authenticated/paniers/')({
  validateSearch: paniersSearchSchema,
  loaderDeps: ({ search }) => search,
  loader: ({ context, deps }) => loadPaniers({ queryClient: context.queryClient, query: deps }),
  pendingComponent: () => <RouteLoading message="Chargement des paniers…" />,
  errorComponent: RouteError,
  component: PaniersListComponent,
})

function PaniersListComponent() {
  const search = Route.useSearch()
  const navigate = useNavigate({ from: Route.fullPath })
  const { data } = useSuspenseQuery(paniersQueryOptions(search))

  return (
    <Page title="Paniers d'indicateurs" description="Collections thématiques d'indicateurs.">
      <Section
        toolbar={
          <Text tone="muted">
            {data.total} panier{data.total > 1 ? 's' : ''}
          </Text>
        }
      >
        {data.items.length === 0 ? (
          <EmptyState title="Aucun panier disponible." />
        ) : (
          <CardGrid>
            {data.items.map((panier) => (
              <PanierCard key={panier.id} panier={panier} />
            ))}
          </CardGrid>
        )}

        <div className="mt-6">
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
      </Section>
    </Page>
  )
}
