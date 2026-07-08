import { indicateurIndividuCommentaireTypeSchema } from '@pilote/kpilot-shared/commentaire'
import { indicateurPublicIdSchema } from '@pilote/kpilot-shared/publicIds'
import { individuPublicIdSchema } from '@pilote/kpilot-shared/individu'
import { referentielPublicIdSchema } from '@pilote/kpilot-shared/referentiel'
import { useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute, Link, redirect, useNavigate } from '@tanstack/react-router'
import { startTransition, useId } from 'react'
import { z } from 'zod'

import { RouteError } from '@/components/RouteError'
import { RouteLoading } from '@/components/RouteLoading'
import { IndicateurCommentaireConfigProvider } from '@/components/indicateurs/commentaires/IndicateurCommentaireConfigProvider'
import { IndicateurCommentairesTab } from '@/components/indicateurs/commentaires/IndicateurCommentairesTab'
import { IndicateurMetadonnees } from '@/components/indicateurs/IndicateurMetadonnees'
import { IndicateurStatsPanel } from '@/components/indicateurs/IndicateurStatsPanel'
import { IndicateurValeursChart } from '@/components/indicateurs/IndicateurValeursChart'
import { IndicateurValeursRemarquables } from '@/components/indicateurs/IndicateurValeursRemarquables'
import { IndicateurWidgets } from '@/components/indicateurs/IndicateurWidgets'
import { IndividuSelect } from '@/components/indicateurs/IndividuSelect'
import { BackLink } from '@/components/ui/BackLink'
import { EmptyState } from '@/components/ui/EmptyState'
import { FormField } from '@/components/ui/FormField'
import { Page } from '@/components/ui/Page'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs'
import { ensureIndividuReferentielPair } from '@/lib/individus/pair'
import {
  indicateurQueryOptions,
  loadIndicateur,
  prefetchIndicateurValeursForIndividu,
} from '@/queries/indicateurs'

const paramsSchema = z.object({
  id: indicateurPublicIdSchema,
})

const searchSchema = z.object({
  individu: individuPublicIdSchema.optional(),
  referentiel: referentielPublicIdSchema.optional(),
  onglet: z.enum(['valeurs', 'metadonnees', 'commentaires']).default('valeurs'),
  commentaires: indicateurIndividuCommentaireTypeSchema.default('CONFIANCE'),
})

export const Route = createFileRoute('/_authenticated/indicateurs/$id')({
  params: {
    parse: (raw) => paramsSchema.parse(raw),
    stringify: ({ id }) => ({ id }),
  },
  validateSearch: searchSchema,
  loaderDeps: ({ search }) => ({ individu: search.individu, referentiel: search.referentiel }),
  loader: async ({ context, params, deps }) => {
    const { queryClient } = context
    const indicateur = await loadIndicateur({ queryClient, indicateurId: params.id })

    const referentielIds = indicateur.referentiels.map((configuration) => configuration.id)
    const pair = await ensureIndividuReferentielPair({
      queryClient,
      referentielIds,
      deps,
      onMismatch: ({ individu, referentiel }) => {
        throw redirect({
          to: '/indicateurs/$id',
          params,
          search: { individu, referentiel },
          replace: true,
        })
      },
    })

    if (pair) {
      await prefetchIndicateurValeursForIndividu({
        queryClient,
        indicateurId: params.id,
        individuId: pair.individu,
        referentielId: pair.referentiel,
      })
    }

    return { indicateur }
  },
  pendingComponent: () => <RouteLoading message="Chargement de l'indicateur…" />,
  errorComponent: RouteError,
  component: IndicateurDetailComponent,
})

function IndicateurDetailComponent() {
  const { id } = Route.useParams()
  const search = Route.useSearch()
  const navigate = useNavigate({ from: Route.fullPath })
  const selectId = useId()

  const { data: indicateur } = useSuspenseQuery(indicateurQueryOptions(id))

  const back = (
    <BackLink asChild>
      <Link
        to="/indicateurs"
        search={{ individu: search.individu, referentiel: search.referentiel }}
      >
        Retour à la liste
      </Link>
    </BackLink>
  )

  if (indicateur.referentiels.length === 0) {
    return (
      <Page title={indicateur.nom} back={back}>
        <EmptyState title="Aucun référentiel associé à cet indicateur." />
      </Page>
    )
  }

  if (!search.individu || !search.referentiel) {
    return (
      <Page title={indicateur.nom} back={back}>
        <EmptyState title="Aucun individu disponible dans les référentiels liés." />
      </Page>
    )
  }

  const individuId = search.individu
  const referentielId = search.referentiel
  const referentielIds = indicateur.referentiels.map((c) => c.id)

  return (
    <Page title={indicateur.nom} back={back}>
      <IndicateurStatsPanel
        indicateurId={id}
        referentielId={referentielId}
        unite={indicateur.unite}
      />

      <div className="max-w-md">
        <FormField label="Individu" htmlFor={selectId}>
          <IndividuSelect
            id={selectId}
            referentielIds={referentielIds}
            value={individuId}
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

      <IndicateurValeursRemarquables
        indicateurId={id}
        individuId={individuId}
        unite={indicateur.unite}
      />

      <Tabs
        value={search.onglet}
        onValueChange={(onglet) => {
          void navigate({
            search: (prev) => ({
              ...prev,
              onglet: onglet as typeof search.onglet,
            }),
          })
        }}
      >
        <TabsList>
          <TabsTrigger value="valeurs">Valeurs</TabsTrigger>
          <TabsTrigger value="metadonnees">Métadonnées</TabsTrigger>
          <TabsTrigger value="commentaires">Commentaires</TabsTrigger>
        </TabsList>

        <TabsContent value="valeurs">
          <div className="space-y-10">
            <IndicateurValeursChart
              indicateurId={id}
              individuId={individuId}
              unite={indicateur.unite}
            />
            <IndicateurWidgets indicateurId={id} referentielId={referentielId} />
          </div>
        </TabsContent>

        <TabsContent value="metadonnees">
          <IndicateurMetadonnees indicateur={indicateur} />
        </TabsContent>

        <TabsContent value="commentaires">
          <IndicateurCommentaireConfigProvider indicateurId={id} individuId={individuId}>
            <IndicateurCommentairesTab
              type={search.commentaires}
              onTypeChange={(commentaires) => {
                void navigate({ search: (prev) => ({ ...prev, commentaires }) })
              }}
            />
          </IndicateurCommentaireConfigProvider>
        </TabsContent>
      </Tabs>
    </Page>
  )
}
