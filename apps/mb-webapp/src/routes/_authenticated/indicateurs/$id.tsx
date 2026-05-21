import { indicateurPublicIdSchema } from '@pilote/mb-shared/indicateur'
import { individuPublicIdSchema } from '@pilote/mb-shared/individu'
import { referentielPublicIdSchema } from '@pilote/mb-shared/referentiel'
import { useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute, Link, redirect, useNavigate } from '@tanstack/react-router'
import { startTransition, useId } from 'react'
import { z } from 'zod'

import { RouteError } from '@/components/RouteError'
import { RouteLoading } from '@/components/RouteLoading'
import { IndicateurMetadonnees } from '@/components/indicateurs/IndicateurMetadonnees'
import { IndicateurStatsPanel } from '@/components/indicateurs/IndicateurStatsPanel'
import { IndicateurValeursChart } from '@/components/indicateurs/IndicateurValeursChart'
import { IndicateurValeursRemarquables } from '@/components/indicateurs/IndicateurValeursRemarquables'
import { IndicateurValeursTable } from '@/components/indicateurs/IndicateurValeursTable'
import { IndividuSelect } from '@/components/indicateurs/IndividuSelect'
import { BackLink } from '@/components/ui/BackLink'
import { EmptyState } from '@/components/ui/EmptyState'
import { FormField } from '@/components/ui/FormField'
import { Page } from '@/components/ui/Page'
import { Section } from '@/components/ui/Section'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs'
import {
  indicateurQueryOptions,
  loadIndicateur,
  prefetchIndicateurValeursForIndividu,
} from '@/queries/indicateurs'
import { loadIndividusFromReferentiels } from '@/queries/referentiels'

const paramsSchema = z.object({
  id: indicateurPublicIdSchema,
})

const searchSchema = z.object({
  individu: individuPublicIdSchema.optional(),
  referentiel: referentielPublicIdSchema.optional(),
})

export const Route = createFileRoute('/_authenticated/indicateurs/$id')({
  params: {
    parse: (raw) => paramsSchema.parse(raw),
    stringify: ({ id }) => ({ id }),
  },
  validateSearch: searchSchema,
  loaderDeps: ({ search }) => ({ individu: search.individu }),
  loader: async ({ context, params, deps }) => {
    const { queryClient } = context
    const indicateur = await loadIndicateur({ queryClient, indicateurId: params.id })

    const referentielIds = indicateur.referentiels.map(
      (configuration) => configuration.referentielPublicId,
    )
    if (referentielIds.length === 0) return { indicateur }

    const individus = await loadIndividusFromReferentiels({
      queryClient,
      referentielIds,
    })
    if (individus.length === 0) return { indicateur }

    const selected = deps.individu ? individus.find((i) => i.id === deps.individu) : undefined
    if (!selected) {
      const first = individus[0]!
      throw redirect({
        to: '/indicateurs/$id',
        params,
        search: { individu: first.id, referentiel: first.referentiel },
        replace: true,
      })
    }

    await prefetchIndicateurValeursForIndividu({
      queryClient,
      indicateurId: params.id,
      individuId: selected.id,
      referentielId: selected.referentiel,
    })

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
      <Link to="/indicateurs" search={{}}>
        Retour à la liste
      </Link>
    </BackLink>
  )

  if (indicateur.referentiels.length === 0) {
    return (
      <Page title={indicateur.nom} back={back}>
        <Section>
          <EmptyState title="Aucun référentiel associé à cet indicateur." />
        </Section>
      </Page>
    )
  }

  if (!search.individu || !search.referentiel) {
    return (
      <Page title={indicateur.nom} back={back}>
        <Section>
          <EmptyState title="Aucun individu disponible dans les référentiels liés." />
        </Section>
      </Page>
    )
  }

  const individuId = search.individu
  const referentielId = search.referentiel

  return (
    <Page title={indicateur.nom} back={back}>
      <IndicateurStatsPanel indicateurId={id} referentielId={referentielId} />

      <FormField label="Individu" htmlFor={selectId}>
        <IndividuSelect
          id={selectId}
          indicateurId={id}
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

      <IndicateurValeursRemarquables indicateurId={id} individuId={individuId} />

      <Section>
        <Tabs defaultValue="valeurs">
          <TabsList>
            <TabsTrigger value="valeurs">Valeurs</TabsTrigger>
            <TabsTrigger value="metadonnees">Métadonnées</TabsTrigger>
          </TabsList>

          <TabsContent value="valeurs">
            <div className="space-y-6">
              <IndicateurValeursChart indicateurId={id} individuId={individuId} />
              <IndicateurValeursTable indicateurId={id} individuId={individuId} />
            </div>
          </TabsContent>

          <TabsContent value="metadonnees">
            <IndicateurMetadonnees indicateur={indicateur} />
          </TabsContent>
        </Tabs>
      </Section>
    </Page>
  )
}
