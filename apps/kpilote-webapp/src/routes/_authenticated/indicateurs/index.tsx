import { individuPublicIdSchema } from '@pilote/kpilote-shared/individu'
import { referentielPublicIdSchema } from '@pilote/kpilote-shared/referentiel'
import { useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router'
import { startTransition } from 'react'
import { z } from 'zod'

import { DashboardSwitch } from '@/components/DashboardSwitch'
import { RouteError } from '@/components/RouteError'
import { RouteLoading } from '@/components/RouteLoading'
import { IndicateurCard } from '@/components/indicateurs/IndicateurCard'
import { FieldIndividuSelect } from '@/components/indicateurs/FieldIndividuSelect'
import { CardGrid } from '@pilote/kpilote-ui/CardGrid'
import { EmptyState } from '@pilote/kpilote-ui/EmptyState'
import { Page } from '@pilote/kpilote-ui/Page'
import { Text } from '@pilote/kpilote-ui/Typography'
import { ensureIndividuReferentielPair } from '@/lib/individus/pair'
import { DEFAULT_PAGE_SIZE, Pagination } from '@pilote/kpilote-ui/Pagination'
import { indicateursQueryOptions, loadIndicateurs } from '@/queries/indicateurs'
import { allReferentielsQueryOptions, loadAllReferentielIds } from '@/queries/referentiels'

const indicateursSearchSchema = z.object({
  cursor: z.string().optional(),
  pageSize: z.coerce.number().int().min(1).max(100).optional(),
  individu: individuPublicIdSchema.optional(),
  referentiel: referentielPublicIdSchema.optional(),
})

type IndicateursSearch = z.infer<typeof indicateursSearchSchema>

const toIndicateursQuery = (search: IndicateursSearch) => ({
  ...search,
  pageSize: search.pageSize ?? DEFAULT_PAGE_SIZE,
})

export const Route = createFileRoute('/_authenticated/indicateurs/')({
  validateSearch: indicateursSearchSchema,
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
          to: '/indicateurs',
          search: { ...deps, individu, referentiel },
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
                {...(search.individu && search.referentiel
                  ? { context: { individu: search.individu, referentiel: search.referentiel } }
                  : {})}
              />
            ))}
          </CardGrid>
        )}

        <Pagination
          hasNext={data.pagination.hasMore}
          onNext={() => {
            const next = data.pagination.cursor
            if (next) void navigate({ search: (prev) => ({ ...prev, cursor: next }) })
          }}
          pageSize={search.pageSize ?? DEFAULT_PAGE_SIZE}
          onPageSizeChange={(pageSize) => {
            void navigate({ search: (prev) => ({ ...prev, pageSize, cursor: undefined }) })
          }}
        />
      </div>
    </Page>
  )
}
