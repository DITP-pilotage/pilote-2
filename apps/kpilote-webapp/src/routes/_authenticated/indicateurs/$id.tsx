import { dimensionPublicIdSchema } from '@pilote/kpilote-shared/dimension'
import { indicateurPublicIdSchema } from '@pilote/kpilote-shared/publicIds'
import { formatCelluleId } from '@pilote/kpilote-shared/cellule'
import { individuPublicIdSchema } from '@pilote/kpilote-shared/individu'
import { referentielPublicIdSchema } from '@pilote/kpilote-shared/referentiel'
import { useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute, Link, redirect, useNavigate } from '@tanstack/react-router'
import { Upload } from 'lucide-react'
import { startTransition, useCallback, useEffect, useMemo } from 'react'
import { z } from 'zod'

import { analyticsEvents } from '@pilote/kpilote-shared/analytics/events'

import { analytics } from '@/analytics/tracker'
import { RouteError } from '@/components/RouteError'
import { RouteLoading } from '@/components/RouteLoading'
import { IndicateurMetadonnees } from '@/components/indicateurs/IndicateurMetadonnees'
import {
  IndicateurResultatsTab,
  type ResultatsMultiDimension,
} from '@/components/indicateurs/IndicateurResultatsTab'
import { FieldIndividuSelect } from '@/components/indicateurs/FieldIndividuSelect'
import { useImportModal } from '@/components/import-valeurs/useImportModal'
import { usePageFileDrop } from '@/components/import-valeurs/usePageFileDrop'
import { BackLink } from '@pilote/kpilote-ui/BackLink'
import { Button } from '@pilote/kpilote-ui/Button'
import { EmptyState } from '@pilote/kpilote-ui/EmptyState'
import { Page } from '@pilote/kpilote-ui/Page'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@pilote/kpilote-ui/Tabs'
import {
  type CelluleCourante,
  type Coordonnee,
  estMultiDimension,
  remplacerCoordonnee,
  resolveCelluleDepuisUrl,
} from '@/lib/individus/cellule'
import { ensureIndividuReferentielPair } from '@/lib/individus/pair'
import { useRecordVisit } from '@/lib/recentlyVisited'
import {
  indicateurQueryOptions,
  loadIndicateur,
  prefetchIndicateurValeursForIndividu,
} from '@/queries/indicateurs'
import { useCanWriteDataCellule } from '@/queries/mePermissions'
import { loadHierarchyFromReferentiels, useHierarchyFromReferentiels } from '@/queries/referentiels'

const paramsSchema = z.object({
  id: indicateurPublicIdSchema,
})

const searchSchema = z.object({
  individu: individuPublicIdSchema.optional(),
  referentiel: referentielPublicIdSchema.optional(),
  onglet: z.enum(['resultats', 'metadonnees']).default('resultats'),
  sousOnglet: z.enum(['confiance', 'evolution', 'commentaire']).default('confiance'),
  // Indicateur multi-dimension uniquement (ignorés en mono-dimension) :
  // coordonnées des dimensions suivantes (CSV de publicIds, absent = « Tous »),
  // cf. lib/individus/cellule.ts, et dimension de décomposition du graphique.
  autres: z.string().optional(),
  decomposition: dimensionPublicIdSchema.optional().catch(undefined),
})

export const Route = createFileRoute('/_authenticated/indicateurs/$id')({
  staticData: {
    title: 'Indicateur',
    documentTitle: ({ indicateur }: { indicateur: Awaited<ReturnType<typeof loadIndicateur>> }) =>
      indicateur.nom,
  },
  params: {
    parse: (raw) => paramsSchema.parse(raw),
    stringify: ({ id }) => ({ id }),
  },
  validateSearch: searchSchema,
  loaderDeps: ({ search }) => ({
    individu: search.individu,
    referentiel: search.referentiel,
    autres: search.autres,
  }),
  loader: async ({ context, params, deps, location }) => {
    const { queryClient } = context
    const indicateur = await loadIndicateur({ queryClient, indicateurId: params.id })

    const referentielIds = indicateur.referentiels.map((configuration) => configuration.id)

    if (estMultiDimension(indicateur.dimensions)) {
      const nodes = await loadHierarchyFromReferentiels({ queryClient, referentielIds })
      const resolution = resolveCelluleDepuisUrl({
        nodes,
        dimensions: indicateur.dimensions,
        search: deps,
      })
      if (resolution.kind === 'mismatch') {
        throw redirect({
          to: '/indicateurs/$id',
          params,
          search: { ...location.search, ...resolution.fallback },
          replace: true,
        })
      }
      if (resolution.kind === 'valid') {
        const [premiere, ...suivantes] = resolution.cellule.coordonnees
        await prefetchIndicateurValeursForIndividu({
          queryClient,
          indicateurId: params.id,
          individuId: resolution.cellule.id,
          referentielId: premiere!.referentiel,
          fixe:
            suivantes.length > 0 ? formatCelluleId(suivantes.map((c) => c.individu)) : undefined,
        })
      }
      return { indicateur }
    }
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

  const { data: indicateur } = useSuspenseQuery(indicateurQueryOptions(id))
  useRecordVisit({ type: 'indicateur', id: indicateur.id, label: indicateur.nom })

  // Les événements de consultation partent aussi à l'arrivée sur la page, pas
  // seulement au changement d'onglet : un lien profond ou l'onglet par défaut
  // sont des consultations que le seul `switch` manquerait.
  useEffect(() => {
    analytics.trackEvent(
      search.onglet === 'metadonnees'
        ? analyticsEvents.indicateur.metadonneesView({ entity_id: id })
        : analyticsEvents.indicateur.resultatsView({ entity_id: id }),
    )
  }, [id, search.onglet])

  useEffect(() => {
    if (search.onglet !== 'resultats') return
    if (search.sousOnglet !== 'confiance' && search.sousOnglet !== 'commentaire') return
    analytics.trackEvent(
      analyticsEvents.commentaire.sectionView({
        entity_type: 'indicateur',
        section: search.sousOnglet,
      }),
    )
  }, [search.onglet, search.sousOnglet])

  const referentielIds = indicateur.referentiels.map((c) => c.id)
  const multiDimension = estMultiDimension(indicateur.dimensions)
  const nodes = useHierarchyFromReferentiels(referentielIds)
  // Cellule courante : résolue depuis l'URL en multi-dimension (le loader a
  // déjà redirigé vers la forme canonique) ; l'individu seul en mono.
  const cellule = useMemo((): CelluleCourante | null => {
    if (multiDimension) {
      const resolution = resolveCelluleDepuisUrl({
        nodes,
        dimensions: indicateur.dimensions,
        search,
      })
      return resolution.kind === 'valid' ? resolution.cellule : null
    }
    if (!search.individu || !search.referentiel) return null
    return {
      id: search.individu,
      coordonnees: [
        {
          dimension: indicateur.dimensions[0]?.id ?? '',
          individu: search.individu,
          referentiel: search.referentiel,
        },
      ],
    }
  }, [multiDimension, nodes, indicateur.dimensions, search])

  // Écriture cachée hors du périmètre d'écriture (WRITE_DATA restreint).
  const canWrite = useCanWriteDataCellule({
    indicateurId: id,
    coordonnees: cellule?.coordonnees ?? [],
    nodes,
    dimensions: indicateur.dimensions,
  })
  const { open, target } = useImportModal()

  const onFile = useCallback(
    (file: File) =>
      open({ indicateur: { id: indicateur.id, nom: indicateur.nom }, initialFile: file }),
    [open, indicateur.id, indicateur.nom],
  )
  // Désactive le drop de page quand la modale d'import est ouverte : le drop doit
  // viser la dropzone de la modale, pas déclencher un second overlay par-dessus.
  const { isDragging } = usePageFileDrop({ enabled: canWrite && target === null, onFile })

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

  if (!search.individu || !search.referentiel || !cellule) {
    return (
      <Page title={indicateur.nom} back={back}>
        <EmptyState title="Aucun individu disponible dans les référentiels liés." />
      </Page>
    )
  }

  const individuId = search.individu
  const referentielId = search.referentiel
  const referentielNom = indicateur.referentiels.find((c) => c.id === referentielId)?.nom ?? null

  // Multi-dimension : change une coordonnée (null = « Tous ») en gardant les
  // autres ; la forme canonique d'URL est recalculée.
  const changerCoordonnee = ({
    dimension,
    coordonnee,
    resetScroll = true,
  }: {
    dimension: string
    coordonnee: Coordonnee | null
    resetScroll?: boolean
  }) => {
    const next = remplacerCoordonnee({
      coordonnees: cellule.coordonnees,
      dimensions: indicateur.dimensions,
      dimension,
      coordonnee,
    })
    if (!next) return
    startTransition(() => {
      void navigate({ search: (prev) => ({ ...prev, ...next }), resetScroll })
    })
  }

  const multi: ResultatsMultiDimension | undefined = multiDimension
    ? {
        dimensions: indicateur.dimensions,
        coordonnees: cellule.coordonnees,
        nodes,
        decomposition: search.decomposition,
        onDecompositionChange: (decomposition) => {
          void navigate({ search: (prev) => ({ ...prev, decomposition }), resetScroll: false })
        },
        onSelectCoordonnee: (coordonnee) =>
          changerCoordonnee({ dimension: coordonnee.dimension, coordonnee, resetScroll: false }),
      }
    : undefined

  return (
    <Page title={indicateur.nom} back={back} actions={actionsFiche}>
      <Tabs
        value={search.onglet}
        onValueChange={(onglet) => {
          analytics.trackEvent(analyticsEvents.indicateur.onglet({ entity_id: id, onglet }))
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
            {/* Sélecteur d'individu propre à l'onglet Résultats : positionné sous la
                navigation primaire et masqué sur l'onglet Informations. */}
            {multiDimension ? (
              // Un sélecteur par dimension, dans l'ordre de remontée. « Tous »
              // (marginale) est proposé tant qu'une autre coordonnée reste fixée.
              <div className="flex flex-wrap gap-4">
                {[...indicateur.dimensions]
                  .sort((a, b) => a.ordre - b.ordre)
                  .map((dimension) => {
                    const coordonnee = cellule.coordonnees.find((c) => c.dimension === dimension.id)
                    const peutEtreTous = cellule.coordonnees.some(
                      (c) => c.dimension !== dimension.id,
                    )
                    return (
                      <div key={dimension.id} className="max-w-md">
                        <FieldIndividuSelect
                          label={dimension.nom}
                          referentielIds={dimension.referentiels}
                          value={coordonnee?.individu ?? null}
                          optionTous={
                            peutEtreTous
                              ? {
                                  // Marginale NONE : valeur saisie directement,
                                  // pas une agrégation des membres.
                                  libelle:
                                    dimension.fonctionAgregation === 'NONE'
                                      ? 'Ensemble (valeur saisie)'
                                      : 'Tous',
                                  onSelect: () =>
                                    changerCoordonnee({
                                      dimension: dimension.id,
                                      coordonnee: null,
                                    }),
                                }
                              : undefined
                          }
                          onChange={({ individu, referentiel }) => {
                            analytics.trackEvent(
                              analyticsEvents.indicateur.individuChange({
                                referentiel_id: referentiel,
                              }),
                            )
                            changerCoordonnee({
                              dimension: dimension.id,
                              coordonnee: { dimension: dimension.id, individu, referentiel },
                            })
                          }}
                        />
                      </div>
                    )
                  })}
              </div>
            ) : (
              <div className="max-w-md">
                <FieldIndividuSelect
                  referentielIds={referentielIds}
                  value={individuId}
                  onChange={({ individu, referentiel }) => {
                    analytics.trackEvent(
                      analyticsEvents.indicateur.individuChange({ referentiel_id: referentiel }),
                    )
                    startTransition(() => {
                      void navigate({
                        search: (prev) => ({ ...prev, individu, referentiel }),
                      })
                    })
                  }}
                />
              </div>
            )}
            <IndicateurResultatsTab
              indicateurId={id}
              individuId={cellule.id}
              multi={multi}
              referentielId={referentielId}
              unite={indicateur.unite}
              referentielNom={referentielNom}
              sousOnglet={search.sousOnglet}
              onSousOngletChange={(sousOnglet) => {
                void navigate({ search: (prev) => ({ ...prev, sousOnglet }), resetScroll: false })
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
