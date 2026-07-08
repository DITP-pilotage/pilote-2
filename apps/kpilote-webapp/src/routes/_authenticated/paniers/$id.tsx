import { panierCommentaireTypeSchema } from '@pilote/kpilote-shared/commentaire'
import { individuPublicIdSchema } from '@pilote/kpilote-shared/individu'
import { referentielPublicIdSchema } from '@pilote/kpilote-shared/referentiel'
import { panierPublicIdSchema } from '@pilote/kpilote-shared/publicIds'
import { useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute, Link, redirect, useNavigate } from '@tanstack/react-router'
import { startTransition, useId } from 'react'
import { z } from 'zod'

import { RouteError } from '@/components/RouteError'
import { RouteLoading } from '@/components/RouteLoading'
import { IndicateurCard } from '@/components/indicateurs/IndicateurCard'
import { IndividuSelect } from '@/components/indicateurs/IndividuSelect'
import { PanierCommentaireConfigProvider } from '@/components/paniers/PanierCommentaireConfigProvider'
import { PanierCommentairesTab } from '@/components/paniers/PanierCommentairesTab'
import { PanierGouvernanceTab } from '@/components/paniers/PanierGouvernanceTab'
import { PanierTauxProgression } from '@/components/paniers/PanierTauxProgression'
import { BackLink } from '@/components/ui/BackLink'
import { CardGrid } from '@/components/ui/CardGrid'
import { EmptyState } from '@/components/ui/EmptyState'
import { FormField } from '@/components/ui/FormField'
import { Page } from '@/components/ui/Page'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs'
import { Text } from '@/components/ui/Typography'
import { ensureIndividuReferentielPair } from '@/lib/individus/pair'
import { indicateursQueryOptions } from '@/queries/indicateurs'
import {
  loadPanier,
  panierQueryOptions,
  panierTauxProgressionQueryOptions,
} from '@/queries/paniers'
import { allReferentielsQueryOptions, loadAllReferentielIds } from '@/queries/referentiels'

const paramsSchema = z.object({
  id: panierPublicIdSchema,
})

const searchSchema = z.object({
  individu: individuPublicIdSchema.optional(),
  referentiel: referentielPublicIdSchema.optional(),
  onglet: z.enum(['resultats', 'commentaires', 'gouvernance']).default('resultats'),
  commentaires: panierCommentaireTypeSchema.default('OBJECTIF'),
})

export const Route = createFileRoute('/_authenticated/paniers/$id')({
  params: {
    parse: (raw) => paramsSchema.parse(raw),
    stringify: ({ id }) => ({ id }),
  },
  validateSearch: searchSchema,
  loaderDeps: ({ search }) => ({ individu: search.individu, referentiel: search.referentiel }),
  loader: async ({ context, params, deps }) => {
    const { queryClient } = context
    const panier = await loadPanier({ queryClient, panierId: params.id })
    if (panier.indicateurIds.length > 0) {
      await queryClient.ensureQueryData(indicateursQueryOptions({ ids: panier.indicateurIds }))
    }

    const referentielIds = await loadAllReferentielIds({ queryClient })
    await ensureIndividuReferentielPair({
      queryClient,
      referentielIds,
      deps,
      onMismatch: ({ individu, referentiel }) => {
        throw redirect({
          to: '/paniers/$id',
          params,
          search: { individu, referentiel },
          replace: true,
        })
      },
    })

    if (deps.individu) {
      await queryClient.prefetchQuery(
        panierTauxProgressionQueryOptions({ panierId: params.id, individu: deps.individu }),
      )
    }

    return { panier }
  },
  pendingComponent: () => <RouteLoading message="Chargement du panier…" />,
  errorComponent: RouteError,
  component: PanierDetailComponent,
})

function PanierDetailComponent() {
  const { id } = Route.useParams()
  const search = Route.useSearch()
  const navigate = useNavigate({ from: Route.fullPath })
  const selectId = useId()
  const { data: panier } = useSuspenseQuery(panierQueryOptions(id))
  const { data: indicateurs } = useSuspenseQuery(
    indicateursQueryOptions({ ids: panier.indicateurIds }),
  )
  const { data: referentiels } = useSuspenseQuery(allReferentielsQueryOptions)
  const referentielIds = referentiels.map((r) => r.id)

  // Re-tri selon l'ordre du panier : la query indicateurs ne garantit pas
  // l'ordre du filtre `ids`.
  const indicateurById = new Map(indicateurs.items.map((i) => [i.id, i]))
  const orderedIndicateurs = panier.indicateurIds
    .map((indicateurId) => indicateurById.get(indicateurId))
    .filter((i): i is NonNullable<typeof i> => i !== undefined)

  const back = (
    <BackLink asChild>
      <Link to="/paniers" search={{ individu: search.individu, referentiel: search.referentiel }}>
        Retour aux paniers
      </Link>
    </BackLink>
  )

  const cardContext =
    search.individu && search.referentiel
      ? { individu: search.individu, referentiel: search.referentiel }
      : undefined

  return (
    <Page title={panier.nom} description={panier.description ?? undefined} back={back}>
      <Tabs
        value={search.onglet}
        onValueChange={(onglet) => {
          void navigate({
            search: (prev) => ({ ...prev, onglet: onglet as typeof search.onglet }),
          })
        }}
      >
        <TabsList>
          <TabsTrigger value="resultats">Résultats</TabsTrigger>
          <TabsTrigger value="commentaires">Commentaires</TabsTrigger>
          <TabsTrigger value="gouvernance">Gouvernance</TabsTrigger>
        </TabsList>

        <TabsContent value="resultats">
          <div className="flex flex-col gap-6">
            {search.individu ? (
              <div className="flex flex-col gap-6">
                <div className="max-w-md">
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
                <div className="max-w-xs">
                  <PanierTauxProgression panierId={id} individu={search.individu} />
                </div>
              </div>
            ) : null}

            <Text as="span" variant="kicker" tone="muted">
              {orderedIndicateurs.length} indicateur{orderedIndicateurs.length > 1 ? 's' : ''}
            </Text>
            {orderedIndicateurs.length === 0 ? (
              <EmptyState title="Ce panier ne contient aucun indicateur." />
            ) : (
              <CardGrid>
                {orderedIndicateurs.map((indicateur) => (
                  <IndicateurCard
                    key={indicateur.id}
                    indicateur={indicateur}
                    {...(cardContext ? { context: cardContext } : {})}
                  />
                ))}
              </CardGrid>
            )}
          </div>
        </TabsContent>

        <TabsContent value="commentaires">
          <PanierCommentaireConfigProvider panierId={id}>
            <PanierCommentairesTab
              type={search.commentaires}
              onTypeChange={(commentaires) => {
                void navigate({ search: (prev) => ({ ...prev, commentaires }) })
              }}
            />
          </PanierCommentaireConfigProvider>
        </TabsContent>

        <TabsContent value="gouvernance">
          <PanierGouvernanceTab
            responsables={panier.responsables}
            contactsUtiles={panier.contactsUtiles}
          />
        </TabsContent>
      </Tabs>
    </Page>
  )
}
