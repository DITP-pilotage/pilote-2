import { indicateurPublicIdSchema } from '@pilote/kpilote-shared/publicIds'
import { useSuspenseQuery, useSuspenseQueries } from '@tanstack/react-query'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { Upload } from 'lucide-react'
import { startTransition, useCallback } from 'react'
import { z } from 'zod'

import { RouteError } from '@/components/RouteError'
import { RouteLoading } from '@/components/RouteLoading'
import { IndicateurMetadonnees } from '@/components/indicateurs/IndicateurMetadonnees'
import { IndicateurResultatsTab } from '@/components/indicateurs/IndicateurResultatsTab'
import { IndividusSelectorBar } from '@/components/indicateurs/IndividusSelectorBar'
import { useImportModal } from '@/components/import-valeurs/useImportModal'
import { usePageFileDrop } from '@/components/import-valeurs/usePageFileDrop'
import { BackLink } from '@pilote/kpilote-ui/BackLink'
import { Button } from '@pilote/kpilote-ui/Button'
import { EmptyState } from '@pilote/kpilote-ui/EmptyState'
import { Page } from '@pilote/kpilote-ui/Page'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@pilote/kpilote-ui/Tabs'
import {
  buildOrderedNodes,
  filterGroupsForReferentiels,
  groupNodesByRootReferentiel,
  resolveIndividuForIndicateur,
} from '@/lib/individus/hierarchy'
import { parseIndividusParam, serializeIndividusParam } from '@/lib/individus/selection'
import { useRecordVisit } from '@/lib/recentlyVisited'
import {
  indicateurQueryOptions,
  loadIndicateur,
  prefetchIndicateurValeursForIndividu,
} from '@/queries/indicateurs'
import {
  loadHierarchyFromReferentiels,
  referentielIndividusQueryOptions,
  referentielQueryOptions,
} from '@/queries/referentiels'
import { useCanWriteIndicateur } from '@/queries/mePermissions'

const paramsSchema = z.object({
  id: indicateurPublicIdSchema,
})

const searchSchema = z.object({
  individus: z.string().optional(),
  onglet: z.enum(['resultats', 'metadonnees']).default('resultats'),
  sousOnglet: z.enum(['confiance', 'evolution', 'commentaire']).default('confiance'),
})

export const Route = createFileRoute('/_authenticated/indicateurs/$id')({
  params: {
    parse: (raw) => paramsSchema.parse(raw),
    stringify: ({ id }) => ({ id }),
  },
  validateSearch: searchSchema,
  loaderDeps: ({ search }) => ({ individus: search.individus }),
  loader: async ({ context, params, deps }) => {
    const { queryClient } = context
    const indicateur = await loadIndicateur({ queryClient, indicateurId: params.id })

    const referentielIds = indicateur.referentiels.map((configuration) => configuration.id)
    const nodes = await loadHierarchyFromReferentiels({ queryClient, referentielIds })
    const groups = filterGroupsForReferentiels(groupNodesByRootReferentiel(nodes), referentielIds)
    const resolved = resolveIndividuForIndicateur({
      indicateurReferentielIds: referentielIds,
      selectedByRoot: parseIndividusParam(deps.individus),
      groups,
    })

    if (resolved) {
      await prefetchIndicateurValeursForIndividu({
        queryClient,
        indicateurId: params.id,
        individuId: resolved.individu.id,
        referentielId: resolved.referentiel.id,
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

  const { data: indicateur } = useSuspenseQuery(indicateurQueryOptions(id))
  useRecordVisit({ type: 'indicateur', id: indicateur.id, label: indicateur.nom })

  const canWrite = useCanWriteIndicateur(id)
  const { open, target } = useImportModal()

  const referentielIds = indicateur.referentiels.map((c) => c.id)
  const referentielsData = useSuspenseQueries({
    queries: referentielIds.map((refId) => referentielQueryOptions(refId)),
    combine: (results) => results.map((r) => r.data),
  })
  const individusByReferentiel = useSuspenseQueries({
    queries: referentielIds.map((refId) => referentielIndividusQueryOptions(refId)),
    combine: (results) => results.map((r) => r.data),
  })

  const referentielsById = new Map(referentielsData.map((r) => [r.id, r] as const))
  const nodes = buildOrderedNodes(
    individusByReferentiel.flatMap((batch) => [...batch]),
    referentielsById,
  )
  const groups = filterGroupsForReferentiels(groupNodesByRootReferentiel(nodes), referentielIds)
  const selected = parseIndividusParam(search.individus)
  const resolved = resolveIndividuForIndicateur({
    indicateurReferentielIds: referentielIds,
    selectedByRoot: selected,
    groups,
  })

  const onFile = useCallback(
    (file: File) =>
      open({ indicateur: { id: indicateur.id, nom: indicateur.nom }, initialFile: file }),
    [open, indicateur.id, indicateur.nom],
  )
  // Désactive le drop de page quand la modale d'import est ouverte : le drop doit
  // viser la dropzone de la modale, pas déclencher un second overlay par-dessus.
  const { isDragging } = usePageFileDrop({ enabled: canWrite && target === null, onFile })

  const onSelect = (rootReferentielId: string, individuId: string) => {
    const next = new Map(selected)
    next.set(rootReferentielId, individuId)
    startTransition(() => {
      void navigate({
        search: (prev) => ({ ...prev, individus: serializeIndividusParam(next) }),
      })
    })
  }

  const actionsFiche = canWrite ? (
    <Button
      variant="secondary"
      size="md"
      onClick={() => open({ indicateur: { id: indicateur.id, nom: indicateur.nom } })}
    >
      <Upload />
      Importer des valeurs
    </Button>
  ) : null

  const back = (
    <BackLink asChild>
      <Link to="/indicateurs" search={{ individus: search.individus }}>
        Tableau de bord
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

  if (!resolved) {
    return (
      <Page title={indicateur.nom} back={back}>
        <EmptyState title="Aucun individu disponible dans les référentiels liés." />
      </Page>
    )
  }

  const individuId = resolved.individu.id
  const referentielId = resolved.referentiel.id
  const referentielNom = resolved.referentiel.nom

  return (
    <Page title={indicateur.nom} back={back} actions={actionsFiche}>
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
          <TabsTrigger value="metadonnees">Informations sur l'indicateur</TabsTrigger>
        </TabsList>

        <TabsContent value="resultats">
          <div className="flex flex-col gap-8">
            {/* Sélecteur d'individu propre à l'onglet Résultats : un seul ensemble
                pour un indicateur donné (règle du ticket). */}
            <IndividusSelectorBar groups={groups} selected={selected} onSelect={onSelect} />
            <IndicateurResultatsTab
              indicateurId={id}
              individuId={individuId}
              referentielId={referentielId}
              unite={indicateur.unite}
              referentielNom={referentielNom}
              sousOnglet={search.sousOnglet}
              onSousOngletChange={(sousOnglet) => {
                void navigate({ search: (prev) => ({ ...prev, sousOnglet }) })
              }}
            />
          </div>
        </TabsContent>

        <TabsContent value="metadonnees">
          <IndicateurMetadonnees indicateur={indicateur} />
        </TabsContent>
      </Tabs>

      {isDragging ? (
        <div className="pointer-events-none fixed inset-0 z-40 flex items-center justify-center bg-primary/10 p-8 backdrop-blur-sm">
          <div className="flex h-full w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed border-primary/40 bg-surface/70">
            <p className="text-lg font-semibold text-primary">Déposez votre fichier CSV ou Excel</p>
            <p className="text-sm text-primary/70">Il sera chargé dans la fenêtre d'import</p>
          </div>
        </div>
      ) : null}
    </Page>
  )
}
