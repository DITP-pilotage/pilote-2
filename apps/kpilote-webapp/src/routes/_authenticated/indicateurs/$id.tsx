import { indicateurPublicIdSchema } from '@pilote/kpilote-shared/publicIds'
import { individuPublicIdSchema } from '@pilote/kpilote-shared/individu'
import { referentielPublicIdSchema } from '@pilote/kpilote-shared/referentiel'
import { useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute, Link, redirect, useNavigate } from '@tanstack/react-router'
import { Upload } from 'lucide-react'
import { startTransition, useCallback, useId } from 'react'
import { z } from 'zod'

import { RouteError } from '@/components/RouteError'
import { RouteLoading } from '@/components/RouteLoading'
import { IndicateurMetadonnees } from '@/components/indicateurs/IndicateurMetadonnees'
import { IndicateurResultatsTab } from '@/components/indicateurs/IndicateurResultatsTab'
import { IndividuSelect } from '@/components/indicateurs/IndividuSelect'
import { useImportModal } from '@/components/import-valeurs/useImportModal'
import { usePageFileDrop } from '@/components/import-valeurs/usePageFileDrop'
import { BackLink } from '@/components/ui/BackLink'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { FormField } from '@/components/ui/FormField'
import { Page } from '@/components/ui/Page'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs'
import { ensureIndividuReferentielPair } from '@/lib/individus/pair'
import { useRecordVisit } from '@/lib/recentlyVisited'
import {
  indicateurQueryOptions,
  loadIndicateur,
  prefetchIndicateurValeursForIndividu,
} from '@/queries/indicateurs'
import { useCanWriteIndicateur } from '@/queries/mePermissions'

const paramsSchema = z.object({
  id: indicateurPublicIdSchema,
})

const searchSchema = z.object({
  individu: individuPublicIdSchema.optional(),
  referentiel: referentielPublicIdSchema.optional(),
  onglet: z.enum(['resultats', 'metadonnees']).default('resultats'),
  sousOnglet: z.enum(['confiance', 'evolution', 'commentaire']).default('confiance'),
})

export const Route = createFileRoute('/_authenticated/indicateurs/$id')({
  params: {
    parse: (raw) => paramsSchema.parse(raw),
    stringify: ({ id }) => ({ id }),
  },
  validateSearch: searchSchema,
  loaderDeps: ({ search }) => ({ individu: search.individu, referentiel: search.referentiel }),
  loader: async ({ context, params, deps, location }) => {
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
          // On préserve le reste du search (onglet, sousOnglet…) : seul le
          // couple individu/referentiel est corrigé. Sinon un lien profond vers
          // un sous-onglet (ex. depuis la palette ⌘K) le perdrait au redirect.
          search: { ...location.search, individu, referentiel },
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
  useRecordVisit({ type: 'indicateur', id: indicateur.id, label: indicateur.nom })

  const canWrite = useCanWriteIndicateur(id)
  const { open, target } = useImportModal()

  const onFile = useCallback(
    (file: File) =>
      open({ indicateur: { id: indicateur.id, nom: indicateur.nom }, initialFile: file }),
    [open, indicateur.id, indicateur.nom],
  )
  // Désactive le drop de page quand la modale d'import est ouverte : le drop doit
  // viser la dropzone de la modale, pas déclencher un second overlay par-dessus.
  const { isDragging } = usePageFileDrop({ enabled: canWrite && target === null, onFile })

  const onFile = useCallback(
    (file: File) =>
      open({ indicateurId: indicateur.id, indicateurNom: indicateur.nom, initialFile: file }),
    [open, indicateur.id, indicateur.nom],
  )
  const { isDragging } = usePageFileDrop({ enabled: canWrite, onFile })

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
  const referentielNom = indicateur.referentiels.find((c) => c.id === referentielId)?.nom ?? null

  return (
    <Page title={indicateur.nom} back={back} actions={actionsFiche}>
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
          <TabsTrigger value="metadonnees">Métadonnées</TabsTrigger>
        </TabsList>

        <TabsContent value="resultats">
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
