import { useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { z } from 'zod'

import { RouteError } from '@/components/RouteError'
import { RouteLoading } from '@/components/RouteLoading'
import { IndicateurCard } from '@/components/indicateurs/IndicateurCard'
import { CardGrid } from '@/components/ui/CardGrid'
import { EmptyState } from '@/components/ui/EmptyState'
import { Page } from '@/components/ui/Page'
import { DEFAULT_PAGE_SIZE_OPTIONS, Pagination } from '@/components/ui/Pagination'
import { SearchField } from '@/components/ui/SearchField'
import { Text } from '@/components/ui/Typography'
import { indicateursQueryOptions, loadIndicateurs } from '@/queries/indicateurs'

const indicateursSearchSchema = z.object({
  recherche: z.string().optional(),
  cursor: z.string().optional(),
  pageSize: z.coerce.number().int().min(1).max(100).optional(),
})

export const Route = createFileRoute('/_authenticated/indicateurs/')({
  validateSearch: indicateursSearchSchema,
  loaderDeps: ({ search }) => search,
  loader: ({ context, deps }) => loadIndicateurs({ queryClient: context.queryClient, query: deps }),
  pendingComponent: () => <RouteLoading message="Chargement des indicateurs…" />,
  errorComponent: RouteError,
  component: IndicateursListComponent,
})

function IndicateursListComponent() {
  const search = Route.useSearch()
  const navigate = useNavigate({ from: Route.fullPath })
  const { data } = useSuspenseQuery(indicateursQueryOptions(search))

  return (
    <Page
      kicker="Catalogue"
      title="Indicateurs"
      description="Toutes les mesures suivies par l'application. Explorez l'historique, les valeurs remarquables et la déclinaison territoriale."
    >
      <div className="flex flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Text as="span" variant="kicker" tone="muted">
            {data.total} indicateur{data.total > 1 ? 's' : ''}
          </Text>
          <SearchField
            label="Rechercher un indicateur par nom"
            placeholder="Rechercher un indicateur…"
            value={search.recherche ?? ''}
            onChange={(value) => {
              const recherche = value || undefined
              void navigate({ search: (prev) => ({ ...prev, recherche, cursor: undefined }) })
            }}
          />
        </div>

        {data.items.length === 0 ? (
          <EmptyState
            title="Aucun indicateur ne correspond"
            description="Essayez d'élargir votre recherche ou de réinitialiser les filtres."
          />
        ) : (
          <CardGrid>
            {data.items.map((indicateur) => (
              <IndicateurCard key={indicateur.id} indicateur={indicateur} />
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
