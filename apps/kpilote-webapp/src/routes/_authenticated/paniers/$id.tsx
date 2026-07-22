import { panierPublicIdSchema } from '@pilote/kpilote-shared/publicIds'
import { useSuspenseQuery, useSuspenseQueries } from '@tanstack/react-query'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { startTransition, Suspense } from 'react'
import { z } from 'zod'

import { RouteError } from '@/components/RouteError'
import { RouteLoading } from '@/components/RouteLoading'
import { SectionCommentaire } from '@/components/commentaires/SectionCommentaire'
import { IndicateurCard } from '@/components/indicateurs/IndicateurCard'
import { IndividusSelectorBar } from '@/components/indicateurs/IndividusSelectorBar'
import { PanierCommentaireConfigProvider } from '@/components/paniers/PanierCommentaireConfigProvider'
import { PanierGouvernanceTab } from '@/components/paniers/PanierGouvernanceTab'
import { PanierTauxProgression } from '@/components/paniers/PanierTauxProgression'
import { BackLink } from '@pilote/kpilote-ui/BackLink'
import { CardGrid } from '@pilote/kpilote-ui/CardGrid'
import { EmptyState } from '@pilote/kpilote-ui/EmptyState'
import { Page } from '@pilote/kpilote-ui/Page'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@pilote/kpilote-ui/Tabs'
import { Text } from '@pilote/kpilote-ui/Typography'
import {
  buildOrderedNodes,
  filterGroupsForReferentiels,
  groupNodesByRootReferentiel,
  pickRoot,
  resolveIndividuForIndicateur,
  type ReferentielGroup,
} from '@/lib/individus/hierarchy'
import { parseIndividusParam, serializeIndividusParam } from '@/lib/individus/selection'
import { useRecordVisit } from '@/lib/recentlyVisited'
import { indicateursQueryOptions } from '@/queries/indicateurs'
import {
  loadPanier,
  panierQueryOptions,
  panierTauxProgressionQueryOptions,
} from '@/queries/paniers'
import {
  loadHierarchyFromReferentiels,
  pertinentReferentielsQueryOptions,
  referentielIndividusQueryOptions,
} from '@/queries/referentiels'

const paramsSchema = z.object({
  id: panierPublicIdSchema,
})

const searchSchema = z.object({
  individus: z.string().optional(),
  onglet: z.enum(['resultats', 'gouvernance', 'confiance', 'commentaires']).default('resultats'),
})

// Individu de l'agrégat panier : uniquement défini quand le panier tient dans un
// seul ensemble (sinon le taux global n'a pas de sens — masqué, cf. PIL-1677).
const singleEnsembleIndividu = (
  groups: ReadonlyArray<ReferentielGroup>,
  selected: ReadonlyMap<string, string>,
): string | null => {
  if (groups.length !== 1) return null
  const group = groups[0]!
  return selected.get(group.referentiel.id) ?? pickRoot(group.nodes)?.individu.id ?? null
}

export const Route = createFileRoute('/_authenticated/paniers/$id')({
  params: {
    parse: (raw) => paramsSchema.parse(raw),
    stringify: ({ id }) => ({ id }),
  },
  validateSearch: searchSchema,
  loaderDeps: ({ search }) => ({ individus: search.individus }),
  loader: async ({ context, params, deps }) => {
    const { queryClient } = context
    const panier = await loadPanier({ queryClient, panierId: params.id })
    if (panier.indicateurIds.length > 0) {
      await queryClient.ensureQueryData(indicateursQueryOptions({ ids: panier.indicateurIds }))
    }

    const referentiels = await queryClient.ensureQueryData(
      pertinentReferentielsQueryOptions(`panier:${params.id}`),
    )
    const referentielIds = referentiels.map((r) => r.id)
    const nodes = await loadHierarchyFromReferentiels({ queryClient, referentielIds })
    const groups = filterGroupsForReferentiels(groupNodesByRootReferentiel(nodes), referentielIds)

    const individu = singleEnsembleIndividu(groups, parseIndividusParam(deps.individus))
    if (individu) {
      await queryClient.prefetchQuery(
        panierTauxProgressionQueryOptions({ panierId: params.id, individu }),
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
  const { data: panier } = useSuspenseQuery(panierQueryOptions(id))
  useRecordVisit({ type: 'panier', id: panier.id, label: panier.nom })
  const { data: indicateurs } = useSuspenseQuery(
    indicateursQueryOptions({ ids: panier.indicateurIds }),
  )
  const { data: referentiels } = useSuspenseQuery(
    pertinentReferentielsQueryOptions(`panier:${id}`),
  )
  const referentielIds = referentiels.map((r) => r.id)
  const individusByReferentiel = useSuspenseQueries({
    queries: referentielIds.map((refId) => referentielIndividusQueryOptions(refId)),
    combine: (results) => results.map((r) => r.data),
  })

  const referentielsById = new Map(referentiels.map((r) => [r.id, r] as const))
  const nodes = buildOrderedNodes(
    individusByReferentiel.flatMap((batch) => [...batch]),
    referentielsById,
  )
  const groups = filterGroupsForReferentiels(groupNodesByRootReferentiel(nodes), referentielIds)
  const selected = parseIndividusParam(search.individus)
  const panierIndividu = singleEnsembleIndividu(groups, selected)

  const onSelect = (rootReferentielId: string, individuId: string) => {
    const next = new Map(selected)
    next.set(rootReferentielId, individuId)
    startTransition(() => {
      void navigate({
        search: (prev) => ({ ...prev, individus: serializeIndividusParam(next) }),
      })
    })
  }

  // Re-tri selon l'ordre du panier : la query indicateurs ne garantit pas
  // l'ordre du filtre `ids`.
  const indicateurById = new Map(indicateurs.items.map((i) => [i.id, i]))
  const orderedIndicateurs = panier.indicateurIds
    .map((indicateurId) => indicateurById.get(indicateurId))
    .filter((i): i is NonNullable<typeof i> => i !== undefined)

  const back = (
    <BackLink asChild>
      <Link to="/paniers" search={{}}>
        Tableau de bord
      </Link>
    </BackLink>
  )

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
          <TabsTrigger value="gouvernance">Gouvernance</TabsTrigger>
          <TabsTrigger value="confiance">Niveaux de confiance</TabsTrigger>
          <TabsTrigger value="commentaires">Commentaires</TabsTrigger>
        </TabsList>

        <TabsContent value="resultats">
          <div className="flex flex-col gap-6">
            {/* Sélecteur d'individu par ensemble, propre à l'onglet Résultats. */}
            <IndividusSelectorBar groups={groups} selected={selected} onSelect={onSelect} />

            {/* Taux global du panier : affiché seulement quand le panier tient dans
                un seul ensemble (un individu applicable non ambigu). */}
            {panierIndividu ? (
              <div className="max-w-xs">
                <PanierTauxProgression panierId={id} individu={panierIndividu} />
              </div>
            ) : null}

            <Text as="span" variant="kicker" tone="muted">
              {orderedIndicateurs.length} indicateur{orderedIndicateurs.length > 1 ? 's' : ''}
            </Text>
            {orderedIndicateurs.length === 0 ? (
              <EmptyState title="Ce panier ne contient aucun indicateur." />
            ) : (
              <CardGrid>
                {orderedIndicateurs.map((indicateur) => {
                  const resolved = resolveIndividuForIndicateur({
                    indicateurReferentielIds: indicateur.referentiels.map((r) => r.id),
                    selectedByRoot: selected,
                    groups,
                  })
                  return (
                    <IndicateurCard
                      key={indicateur.id}
                      indicateur={indicateur}
                      {...(resolved
                        ? { context: { individu: resolved.individu.id, individus: search.individus } }
                        : {})}
                    />
                  )
                })}
              </CardGrid>
            )}
          </div>
        </TabsContent>

        <TabsContent value="gouvernance">
          <PanierGouvernanceTab
            responsables={panier.responsables}
            contactsUtiles={panier.contactsUtiles}
          />
        </TabsContent>

        <TabsContent value="confiance">
          <PanierCommentaireConfigProvider panierId={id}>
            <Suspense fallback={<RouteLoading message="Chargement des commentaires…" />}>
              <SectionCommentaire type="CONFIANCE" />
            </Suspense>
          </PanierCommentaireConfigProvider>
        </TabsContent>

        <TabsContent value="commentaires">
          <PanierCommentaireConfigProvider panierId={id}>
            <Suspense fallback={<RouteLoading message="Chargement des commentaires…" />}>
              <SectionCommentaire type="DEFAUT" />
            </Suspense>
          </PanierCommentaireConfigProvider>
        </TabsContent>
      </Tabs>
    </Page>
  )
}
