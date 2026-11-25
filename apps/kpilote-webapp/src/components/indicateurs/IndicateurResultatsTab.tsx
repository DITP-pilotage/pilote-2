import { type SensSouhaite, type UniteIndicateurApiModel } from '@pilote/kpilote-shared/indicateur'
import { Suspense, useState } from 'react'

import { SectionCommentaire } from '@/components/commentaires/SectionCommentaire'
import { RouteLoading } from '@/components/RouteLoading'
import { IndicateurCommentaireConfigProvider } from '@/components/indicateurs/commentaires/IndicateurCommentaireConfigProvider'
import { IndicateurSynthesePanel } from '@/components/indicateurs/IndicateurSynthesePanel'
import { IndicateurValeursChart } from '@/components/indicateurs/IndicateurValeursChart'
import { IndicateurValeursDecomposeesChart } from '@/components/indicateurs/IndicateurValeursDecomposeesChart'
import { IndicateurWidgets } from '@/components/indicateurs/IndicateurWidgets'
import { buildDecomposition } from '@/lib/axes/decomposition'
import { type AxeWithModalites, type SelectionModalites } from '@/lib/axes/selection'
import { Checkbox } from '@pilote/kpilote-ui/Checkbox'
import { FieldSelect } from '@pilote/kpilote-ui/FieldSelect'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@pilote/kpilote-ui/Tabs'

type SousOnglet = 'confiance' | 'evolution' | 'commentaire'

const NO_DECOMPOSITION = ''

function EvolutionChart({
  indicateurId,
  individuId,
  unite,
  modalites,
  legend,
  axes,
  selection,
  decomposer,
  onDecomposerChange,
}: {
  indicateurId: string
  individuId: string
  unite: UniteIndicateurApiModel | null
  modalites: ReadonlyArray<string>
  legend: string | null
  axes: ReadonlyArray<AxeWithModalites>
  selection: SelectionModalites
  decomposer: string | undefined
  onDecomposerChange: (axeId: string | undefined) => void
}) {
  const [showEnsemble, setShowEnsemble] = useState(true)
  const chart = (
    <IndicateurValeursChart
      indicateurId={indicateurId}
      individuId={individuId}
      unite={unite}
      modalites={modalites}
      legend={legend}
    />
  )
  if (axes.length === 0) return chart

  const axe = axes.find((candidate) => candidate.id === decomposer)
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-6">
        <div className="w-full max-w-xs">
          <FieldSelect
            label="Décomposer par"
            value={axe?.id ?? NO_DECOMPOSITION}
            onValueChange={(value) =>
              onDecomposerChange(value === NO_DECOMPOSITION ? undefined : value)
            }
            options={[
              { value: NO_DECOMPOSITION, label: 'Aucun axe' },
              ...axes.map((candidate) => ({ value: candidate.id, label: candidate.nom })),
            ]}
          />
        </div>
        {axe ? (
          <Checkbox
            className="pb-2.5"
            checked={showEnsemble}
            onCheckedChange={setShowEnsemble}
            label="Afficher l'ensemble"
          />
        ) : null}
      </div>
      <Suspense fallback={<RouteLoading message="Chargement du graphique…" />}>
        {axe ? (
          <IndicateurValeursDecomposeesChart
            indicateurId={indicateurId}
            individuId={individuId}
            unite={unite}
            modalites={modalites}
            legend={legend ?? 'Ensemble'}
            showEnsemble={showEnsemble}
            decomposition={buildDecomposition({ axes, selection, axeId: axe.id })}
            axeNom={axe.nom}
          />
        ) : (
          chart
        )}
      </Suspense>
    </div>
  )
}

export function IndicateurResultatsTab({
  indicateurId,
  individuId,
  referentielId,
  unite,
  sensSouhaite,
  referentielNom,
  modalites,
  legend,
  axes,
  selection,
  decomposer,
  onDecomposerChange,
  sousOnglet,
  onSousOngletChange,
}: {
  indicateurId: string
  individuId: string
  referentielId: string
  unite: UniteIndicateurApiModel | null
  sensSouhaite: SensSouhaite
  referentielNom: string | null
  modalites: ReadonlyArray<string>
  /** Indicateur à axes : la sélection en clair (« Ensemble », « Orange »…). */
  legend: string | null
  /** Vide pour un indicateur sans axe : graphique simple, sans « Décomposer par ». */
  axes: ReadonlyArray<AxeWithModalites>
  selection: SelectionModalites
  /** Axe selon lequel décomposer le graphique ; ignoré s'il n'est pas déclaré. */
  decomposer: string | undefined
  onDecomposerChange: (axeId: string | undefined) => void
  sousOnglet: SousOnglet
  onSousOngletChange: (sousOnglet: SousOnglet) => void
}) {
  return (
    <div className="space-y-8">
      <IndicateurSynthesePanel
        indicateurId={indicateurId}
        referentielId={referentielId}
        individuId={individuId}
        unite={unite}
        sensSouhaite={sensSouhaite}
        referentielNom={referentielNom}
        modalites={modalites}
        legend={legend}
      />

      <Tabs value={sousOnglet} onValueChange={(valeur) => onSousOngletChange(valeur as SousOnglet)}>
        <TabsList>
          <TabsTrigger value="confiance" className="text-xs">
            Niveaux de confiance
          </TabsTrigger>
          <TabsTrigger value="evolution" className="text-xs">
            Evolution et répartition
          </TabsTrigger>
          <TabsTrigger value="commentaire" className="text-xs">
            Commentaires
          </TabsTrigger>
        </TabsList>

        <TabsContent value="confiance">
          <IndicateurCommentaireConfigProvider indicateurId={indicateurId} individuId={individuId}>
            <Suspense fallback={<RouteLoading message="Chargement des commentaires…" />}>
              <SectionCommentaire type="CONFIANCE" />
            </Suspense>
          </IndicateurCommentaireConfigProvider>
        </TabsContent>

        <TabsContent value="evolution">
          <div className="space-y-10">
            <EvolutionChart
              indicateurId={indicateurId}
              individuId={individuId}
              unite={unite}
              modalites={modalites}
              legend={legend}
              axes={axes}
              selection={selection}
              decomposer={decomposer}
              onDecomposerChange={onDecomposerChange}
            />
            {/* Données (referentiel, individus, valeurs remarquables) déjà
                préfetchées par le loader de la route, et la carte est un import
                statique : aucune suspension ici, donc pas de boundary. */}
            <IndicateurWidgets
              indicateurId={indicateurId}
              referentielId={referentielId}
              modalites={modalites}
            />
          </div>
        </TabsContent>

        <TabsContent value="commentaire">
          <IndicateurCommentaireConfigProvider indicateurId={indicateurId} individuId={individuId}>
            <Suspense fallback={<RouteLoading message="Chargement des commentaires…" />}>
              <SectionCommentaire type="DEFAUT" />
            </Suspense>
          </IndicateurCommentaireConfigProvider>
        </TabsContent>
      </Tabs>
    </div>
  )
}
