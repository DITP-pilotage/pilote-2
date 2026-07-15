import { individuPublicIdSchema } from '@pilote/kpilote-shared/individu'
import { referentielPublicIdSchema } from '@pilote/kpilote-shared/referentiel'
import { useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router'
import { startTransition, useId } from 'react'
import { z } from 'zod'

import { DashboardSwitch } from '@/components/DashboardSwitch'
import { RouteError } from '@/components/RouteError'
import { RouteLoading } from '@/components/RouteLoading'
import { IndividuSelect } from '@/components/indicateurs/IndividuSelect'
import { PanierCard } from '@/components/paniers/PanierCard'
import { CardGrid } from '@/components/ui/CardGrid'
import { EmptyState } from '@/components/ui/EmptyState'
import { FormField } from '@/components/ui/FormField'
import { Page } from '@/components/ui/Page'
import { DEFAULT_PAGE_SIZE_OPTIONS, Pagination } from '@/components/ui/Pagination'
import { Text } from '@/components/ui/Typography'
import { ensureIndividuReferentielPair } from '@/lib/individus/pair'
import { loadPaniers, paniersQueryOptions } from '@/queries/paniers'
import { allReferentielsQueryOptions, loadAllReferentielIds } from '@/queries/referentiels'

const paniersSearchSchema = z.object({
  cursor: z.string().optional(),
  pageSize: z.coerce.number().int().min(1).max(100).optional(),
  individu: individuPublicIdSchema.optional(),
  referentiel: referentielPublicIdSchema.optional(),
})

export const Route = createFileRoute('/_authenticated/paniers/')({
  validateSearch: paniersSearchSchema,
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
          to: '/paniers',
          search: { ...deps, individu, referentiel },
          replace: true,
        })
      },
    })

    return loadPaniers({
      queryClient,
      query: { cursor: deps.cursor, pageSize: deps.pageSize },
    })
  },
  pendingComponent: () => <RouteLoading message="Chargement des paniers…" />,
  errorComponent: RouteError,
  component: PaniersListComponent,
})

function PaniersListComponent() {
  const search = Route.useSearch()
  const navigate = useNavigate({ from: Route.fullPath })
  const selectId = useId()
  const { data } = useSuspenseQuery(
    paniersQueryOptions({ cursor: search.cursor, pageSize: search.pageSize }),
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
      description="Consultez et gérez l'ensemble de vos indicateurs par valeur ou par dossier."
      stickybar={
        <>
          {search.individu ? (
            <div>
              <FormField label="Individu" htmlFor={selectId}>
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
        </>
      }
    >
      <div className="flex flex-col gap-6">
        <Text as="span" variant="kicker" tone="muted">
          {data.total} dossier{data.total > 1 ? 's' : ''}
        </Text>

        {data.items.length === 0 ? (
          <EmptyState title="Aucun panier disponible" />
        ) : (
          <CardGrid>
            {data.items.map((panier) => (
              <PanierCard key={panier.id} panier={panier} context={cardContext} />
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
