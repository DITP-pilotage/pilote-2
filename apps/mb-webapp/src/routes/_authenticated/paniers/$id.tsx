import { panierPublicIdSchema } from '@pilote/mb-shared/publicIds'
import { useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute, Link } from '@tanstack/react-router'
import { z } from 'zod'

import { RouteError } from '@/components/RouteError'
import { RouteLoading } from '@/components/RouteLoading'
import { IndicateurCard } from '@/components/indicateurs/IndicateurCard'
import { BackLink } from '@/components/ui/BackLink'
import { CardGrid } from '@/components/ui/CardGrid'
import { EmptyState } from '@/components/ui/EmptyState'
import { Page } from '@/components/ui/Page'
import { Text } from '@/components/ui/Typography'
import { indicateursQueryOptions } from '@/queries/indicateurs'
import { loadPanier, panierQueryOptions } from '@/queries/paniers'

const paramsSchema = z.object({
  id: panierPublicIdSchema,
})

export const Route = createFileRoute('/_authenticated/paniers/$id')({
  params: {
    parse: (raw) => paramsSchema.parse(raw),
    stringify: ({ id }) => ({ id }),
  },
  loader: async ({ context, params }) => {
    const { queryClient } = context
    const panier = await loadPanier({ queryClient, panierId: params.id })
    if (panier.indicateurIds.length > 0) {
      await queryClient.ensureQueryData(indicateursQueryOptions({ ids: panier.indicateurIds }))
    }
    return { panier }
  },
  pendingComponent: () => <RouteLoading message="Chargement du panier…" />,
  errorComponent: RouteError,
  component: PanierDetailComponent,
})

function PanierDetailComponent() {
  const { id } = Route.useParams()
  const { data: panier } = useSuspenseQuery(panierQueryOptions(id))
  const { data: indicateurs } = useSuspenseQuery(
    indicateursQueryOptions({ ids: panier.indicateurIds }),
  )

  // Re-tri selon l'ordre du panier : la query indicateurs ne garantit pas
  // l'ordre du filtre `ids`.
  const indicateurById = new Map(indicateurs.items.map((i) => [i.id, i]))
  const orderedIndicateurs = panier.indicateurIds
    .map((indicateurId) => indicateurById.get(indicateurId))
    .filter((i): i is NonNullable<typeof i> => i !== undefined)

  const back = (
    <BackLink asChild>
      <Link to="/paniers" search={{}}>
        Retour aux paniers
      </Link>
    </BackLink>
  )

  return (
    <Page
      kicker={panier.id}
      title={panier.nom}
      description={panier.description ?? undefined}
      back={back}
    >
      <div className="flex flex-col gap-6">
        <Text as="span" variant="kicker" tone="muted">
          {orderedIndicateurs.length} indicateur{orderedIndicateurs.length > 1 ? 's' : ''}
        </Text>
        {orderedIndicateurs.length === 0 ? (
          <EmptyState title="Ce panier ne contient aucun indicateur." />
        ) : (
          <CardGrid>
            {orderedIndicateurs.map((indicateur) => (
              <IndicateurCard key={indicateur.id} indicateur={indicateur} />
            ))}
          </CardGrid>
        )}
      </div>
    </Page>
  )
}
