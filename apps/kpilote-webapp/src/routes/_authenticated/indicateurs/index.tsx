import { type ListIndicateursQuery } from '@pilote/kpilote-shared/indicateur'
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
import { IndicateurCard } from '@/components/indicateurs/IndicateurCard'
import { CardGrid } from '@pilote/kpilote-ui/CardGrid'
import { EmptyState } from '@pilote/kpilote-ui/EmptyState'
import { Page } from '@pilote/kpilote-ui/Page'
import { Section } from '@pilote/kpilote-ui/Section'
import { ensureSelectionIndividus } from '@/lib/individus/ensureSelection'
import { resolveIndicateurReading } from '@/lib/individus/selection'
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

// Le tableau de bord n'affiche que les indicateurs attribués à l'utilisateur : les
// indicateurs visibles seulement parce qu'ils sont publics n'y figurent pas (PIL-1976).
// La sélection ordonne la liste : les indicateurs qu'elle concerne passent en tête.
const toIndicateursQuery = ({
  selectedIndividus,
  ...search
}: IndicateursSearch): ListIndicateursQuery => {
  const selection = splitCsv(selectedIndividus)
  return {
    ...search,
    pageSize: search.pageSize ?? DEFAULT_PAGE_SIZE,
    acces: 'attribue',
    ...(selection.length > 0 ? { individus: selection } : {}),
  }
}

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

      <Section
        tone="plain"
        title="Mes indicateurs"
        description={`${data.total} indicateur${data.total > 1 ? 's' : ''}`}
      >
        <div className="flex flex-col gap-6">
          {data.items.length === 0 ? (
            <EmptyState
              title="Vous n'avez encore accès à aucun indicateur KPILOTE."
              description="Vous pouvez vous rapprocher de votre référent KPILOTE ou du support."
            />
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
      </Section>
    </Page>
  )
}
