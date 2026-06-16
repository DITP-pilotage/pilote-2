import { individuPublicIdSchema } from '@pilote/mb-shared/individu'
import { referentielPublicIdSchema } from '@pilote/mb-shared/referentiel'
import { useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router'
import { startTransition, useId } from 'react'
import { z } from 'zod'

import { DashboardSwitch } from '@/components/DashboardSwitch'
import { RouteError } from '@/components/RouteError'
import { RouteLoading } from '@/components/RouteLoading'
import { IndicateurCard } from '@/components/indicateurs/IndicateurCard'
import { IndividuSelect } from '@/components/indicateurs/IndividuSelect'
import { CardGrid } from '@/components/ui/CardGrid'
import { EmptyState } from '@/components/ui/EmptyState'
import { FormField } from '@/components/ui/FormField'
import { Page } from '@/components/ui/Page'
import { SearchField } from '@/components/ui/SearchField'
import { Text } from '@/components/ui/Typography'
import { ensureIndividuReferentielPair } from '@/lib/individus/pair'
import { DEFAULT_PAGE_SIZE_OPTIONS, Pagination } from '@/components/ui/Pagination'
import { indicateursQueryOptions, loadIndicateurs } from '@/queries/indicateurs'
import { allReferentielsQueryOptions, loadAllReferentielIds } from '@/queries/referentiels'

const indicateursSearchSchema = z.object({
  recherche: z.string().optional(),
  cursor: z.string().optional(),
  pageSize: z.coerce.number().int().min(1).max(100).optional(),
  individu: individuPublicIdSchema.optional(),
  referentiel: referentielPublicIdSchema.optional(),
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

    return loadIndicateurs({ queryClient, query: deps })
  },
  pendingComponent: () => <RouteLoading message="Chargement des indicateurs…" />,
  errorComponent: RouteError,
  component: IndicateursListComponent,
})

function IndicateursListComponent() {
  const search = Route.useSearch()
  const navigate = useNavigate({ from: Route.fullPath })
  const selectId = useId()
  const { data } = useSuspenseQuery(indicateursQueryOptions(search))
  const { data: referentiels } = useSuspenseQuery(allReferentielsQueryOptions)
  const referentielIds = referentiels.map((r) => r.id)

  return (
    <Page
      title="Tableau de bord"
      description="Consultez et gérez l'ensemble de vos indicateurs par valeur ou par dossier."
    >
      <div className="flex flex-col gap-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          {search.individu ? (
            <div className="max-w-md flex-1">
              <FormField label="Individu observé" htmlFor={selectId}>
                <IndividuSelect
                  id={selectId}
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
              </FormField>
            </div>
          ) : (
            <div />
          )}
          <DashboardSwitch />
        </div>

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
          pageSize={search.pageSize ?? DEFAULT_PAGE_SIZE_OPTIONS[0]}
          onPageSizeChange={(pageSize) => {
            void navigate({ search: (prev) => ({ ...prev, pageSize, cursor: undefined }) })
          }}
        />
      </div>
    </Page>
  )
}
