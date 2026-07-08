import { individuPublicIdSchema } from '@pilote/kpilote-shared/individu'
import { referentielPublicIdSchema } from '@pilote/kpilote-shared/referentiel'
import { dossierPublicIdSchema } from '@pilote/kpilote-shared/publicIds'
import { useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute, Link, redirect, useNavigate } from '@tanstack/react-router'
import { startTransition, Suspense } from 'react'
import { z } from 'zod'

import { RouteError } from '@/components/RouteError'
import { RouteLoading } from '@/components/RouteLoading'
import { SectionCommentaire } from '@/components/commentaires/SectionCommentaire'
import { DossierCommentaireConfigProvider } from '@/components/dossiers/DossierCommentaireConfigProvider'
import { DossierGouvernanceTab } from '@/components/dossiers/DossierGouvernanceTab'
import { DossierTauxProgression } from '@/components/dossiers/DossierTauxProgression'
import { FieldIndividuSelect } from '@/components/indicateurs/FieldIndividuSelect'
import { IndicateurCard } from '@/components/indicateurs/IndicateurCard'
import { BackLink } from '@pilote/kpilote-ui/BackLink'
import { CardGrid } from '@pilote/kpilote-ui/CardGrid'
import { EmptyState } from '@pilote/kpilote-ui/EmptyState'
import { Page } from '@pilote/kpilote-ui/Page'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@pilote/kpilote-ui/Tabs'
import { Text } from '@pilote/kpilote-ui/Typography'
import { ensureIndividuReferentielPair } from '@/lib/individus/pair'
import { useRecordVisit } from '@/lib/recentlyVisited'
import { indicateursQueryOptions } from '@/queries/indicateurs'
import {
  loadDossier,
  dossierQueryOptions,
  dossierTauxProgressionQueryOptions,
} from '@/queries/dossiers'
import { allReferentielsQueryOptions, loadAllReferentielIds } from '@/queries/referentiels'

const paramsSchema = z.object({
  id: dossierPublicIdSchema,
})

const searchSchema = z.object({
  individu: individuPublicIdSchema.optional(),
  referentiel: referentielPublicIdSchema.optional(),
  onglet: z.enum(['resultats', 'gouvernance', 'confiance', 'commentaires']).default('resultats'),
})

export const Route = createFileRoute('/_authenticated/dossiers/$id')({
  params: {
    parse: (raw) => paramsSchema.parse(raw),
    stringify: ({ id }) => ({ id }),
  },
  validateSearch: searchSchema,
  loaderDeps: ({ search }) => ({ individu: search.individu, referentiel: search.referentiel }),
  loader: async ({ context, params, deps, location }) => {
    const { queryClient } = context
    const dossier = await loadDossier({ queryClient, dossierId: params.id })
    if (dossier.indicateurIds.length > 0) {
      await queryClient.ensureQueryData(indicateursQueryOptions({ ids: dossier.indicateurIds }))
    }

    const referentielIds = await loadAllReferentielIds({ queryClient })
    await ensureIndividuReferentielPair({
      queryClient,
      referentielIds,
      deps,
      onMismatch: ({ individu, referentiel }) => {
        throw redirect({
          to: '/dossiers/$id',
          params,
          // On préserve le reste du search (onglet…) : seul le couple
          // individu/referentiel est corrigé. Sinon un lien profond vers un
          // onglet (ex. depuis la palette ⌘K) le perdrait au redirect.
          search: { ...location.search, individu, referentiel },
          replace: true,
        })
      },
    })

    if (deps.individu) {
      await queryClient.prefetchQuery(
        dossierTauxProgressionQueryOptions({ dossierId: params.id, individu: deps.individu }),
      )
    }

    return { dossier }
  },
  pendingComponent: () => <RouteLoading message="Chargement du dossier…" />,
  errorComponent: RouteError,
  component: DossierDetailComponent,
})

function DossierDetailComponent() {
  const { id } = Route.useParams()
  const search = Route.useSearch()
  const navigate = useNavigate({ from: Route.fullPath })
  const { data: dossier } = useSuspenseQuery(dossierQueryOptions(id))
  useRecordVisit({ type: 'dossier', id: dossier.id, label: dossier.nom })
  const { data: indicateurs } = useSuspenseQuery(
    indicateursQueryOptions({ ids: dossier.indicateurIds }),
  )
  const { data: referentiels } = useSuspenseQuery(allReferentielsQueryOptions)
  const referentielIds = referentiels.map((r) => r.id)

  // Re-tri selon l'ordre du dossier : la query indicateurs ne garantit pas
  // l'ordre du filtre `ids`.
  const indicateurById = new Map(indicateurs.items.map((i) => [i.id, i]))
  const orderedIndicateurs = dossier.indicateurIds
    .map((indicateurId) => indicateurById.get(indicateurId))
    .filter((i): i is NonNullable<typeof i> => i !== undefined)

  const back = (
    <BackLink asChild>
      <Link to="/dossiers" search={{ individu: search.individu, referentiel: search.referentiel }}>
        Tableau de bord
      </Link>
    </BackLink>
  )

  const cardContext =
    search.individu && search.referentiel
      ? { individu: search.individu, referentiel: search.referentiel }
      : undefined

  return (
    <Page title={dossier.nom} description={dossier.description ?? undefined} back={back}>
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
            {search.individu && (
              <>
                {/* Sélecteur d'individu propre à l'onglet Résultats : positionné sous
                    la navigation primaire et masqué sur les autres onglets. */}
                <div className="max-w-md">
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
                <div className="max-w-xs">
                  <DossierTauxProgression dossierId={id} individu={search.individu} />
                </div>
              </>
            )}

            <Text as="span" variant="kicker" tone="muted">
              {orderedIndicateurs.length} indicateur{orderedIndicateurs.length > 1 ? 's' : ''}
            </Text>
            {orderedIndicateurs.length === 0 ? (
              <EmptyState title="Ce dossier ne contient aucun indicateur." />
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

        <TabsContent value="gouvernance">
          <DossierGouvernanceTab
            responsables={dossier.responsables}
            contactsUtiles={dossier.contactsUtiles}
          />
        </TabsContent>

        <TabsContent value="confiance">
          <DossierCommentaireConfigProvider dossierId={id}>
            <Suspense fallback={<RouteLoading message="Chargement des commentaires…" />}>
              <SectionCommentaire type="CONFIANCE" />
            </Suspense>
          </DossierCommentaireConfigProvider>
        </TabsContent>

        <TabsContent value="commentaires">
          <DossierCommentaireConfigProvider dossierId={id}>
            <Suspense fallback={<RouteLoading message="Chargement des commentaires…" />}>
              <SectionCommentaire type="DEFAUT" />
            </Suspense>
          </DossierCommentaireConfigProvider>
        </TabsContent>
      </Tabs>
    </Page>
  )
}
