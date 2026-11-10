import { formatCelluleId } from '@pilote/kpilote-shared/cellule'
import { type UniteIndicateurApiModel } from '@pilote/kpilote-shared/indicateur'
import { Suspense } from 'react'

import { SectionCommentaire } from '@/components/commentaires/SectionCommentaire'
import { RouteLoading } from '@/components/RouteLoading'
import { IndicateurCommentaireConfigProvider } from '@/components/indicateurs/commentaires/IndicateurCommentaireConfigProvider'
import { IndicateurSynthesePanel } from '@/components/indicateurs/IndicateurSynthesePanel'
import { IndicateurValeursChart } from '@/components/indicateurs/IndicateurValeursChart'
import { IndicateurValeursDecomposeesChart } from '@/components/indicateurs/IndicateurValeursDecomposeesChart'
import { IndicateurWidgets } from '@/components/indicateurs/IndicateurWidgets'
import { FieldSelect } from '@pilote/kpilote-ui/FieldSelect'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@pilote/kpilote-ui/Tabs'
import { type Coordonnee, type DimensionCellule } from '@/lib/individus/cellule'
import { construireDecomposition, membresDecomposition } from '@/lib/individus/decomposition'
import { type IndividuNode } from '@/lib/individus/hierarchy'

type SousOnglet = 'confiance' | 'evolution' | 'commentaire'

// Contexte d'un indicateur multi-dimension (absent en mono-dimension : rendu et
// requêtes historiques).
export type ResultatsMultiDimension = {
  dimensions: ReadonlyArray<DimensionCellule>
  // Coordonnées de la cellule courante, dans l'ordre des dimensions.
  coordonnees: ReadonlyArray<Coordonnee>
  nodes: ReadonlyArray<IndividuNode>
  decomposition: string | undefined
  onDecompositionChange: (dimension: string | undefined) => void
  // Clic sur la carte : remplace la coordonnée de cette dimension.
  onSelectCoordonnee: (coordonnee: Coordonnee) => void
}

const nomDe = (nodes: ReadonlyArray<IndividuNode>, individu: string): string =>
  nodes.find((node) => node.individu.id === individu)?.individu.nom ?? individu

// Coordonnées fixées hors `dimension` : `fixe` (cellule partielle) et libellé.
const tranche = ({
  multi,
  dimension,
}: {
  multi: ResultatsMultiDimension
  dimension: string
}): { fixe: string | undefined; libelle: string | undefined } => {
  const autres = multi.coordonnees.filter((c) => c.dimension !== dimension)
  if (autres.length === 0) return { fixe: undefined, libelle: undefined }
  return {
    fixe: formatCelluleId(autres.map((c) => c.individu)),
    libelle: autres.map((c) => nomDe(multi.nodes, c.individu)).join(' · '),
  }
}

const AUCUNE_DECOMPOSITION = ''

function EvolutionMultiDimension({
  indicateurId,
  celluleId,
  unite,
  multi,
}: {
  indicateurId: string
  celluleId: string
  unite: UniteIndicateurApiModel | null
  multi: ResultatsMultiDimension
}) {
  const dimension = multi.dimensions.find((d) => d.id === multi.decomposition)
  const decomposition = dimension
    ? construireDecomposition({
        coordonnees: multi.coordonnees,
        dimensions: multi.dimensions,
        dimension: dimension.id,
        membres: membresDecomposition({
          nodes: multi.nodes.filter((node) =>
            dimension.referentiels.includes(node.individu.referentiel),
          ),
          individu: multi.coordonnees.find((c) => c.dimension === dimension.id)?.individu ?? null,
        }),
      })
    : null

  return (
    <div className="space-y-10">
      <div className="space-y-4">
        <div className="max-w-xs">
          <FieldSelect
            label="Décomposer par"
            value={dimension?.id ?? AUCUNE_DECOMPOSITION}
            onValueChange={(value) =>
              multi.onDecompositionChange(value === AUCUNE_DECOMPOSITION ? undefined : value)
            }
            options={[
              { value: AUCUNE_DECOMPOSITION, label: '(aucune)' },
              ...multi.dimensions.map((d) => ({ value: d.id, label: d.nom })),
            ]}
          />
        </div>
        <Suspense fallback={<RouteLoading message="Chargement du graphique…" />}>
          {dimension && decomposition ? (
            <IndicateurValeursDecomposeesChart
              indicateurId={indicateurId}
              decomposition={decomposition}
              dimensionNom={dimension.nom}
              unite={unite}
            />
          ) : (
            <IndicateurValeursChart
              indicateurId={indicateurId}
              individuId={celluleId}
              unite={unite}
            />
          )}
        </Suspense>
      </div>
      {/* Une carte par coordonnée dont le niveau porte des widgets (en pratique
          la tranche territoriale), les autres coordonnées restant fixées. */}
      <Suspense fallback={<RouteLoading message="Chargement de la carte…" />}>
        {multi.coordonnees.map((coordonnee) => {
          const { fixe, libelle } = tranche({ multi, dimension: coordonnee.dimension })
          return (
            <IndicateurWidgets
              key={coordonnee.dimension}
              indicateurId={indicateurId}
              referentielId={coordonnee.referentiel}
              fixe={fixe}
              libelleTranche={libelle}
              onSelectIndividu={(individu) => multi.onSelectCoordonnee({ ...coordonnee, individu })}
            />
          )
        })}
      </Suspense>
    </div>
  )
}

export function IndicateurResultatsTab({
  indicateurId,
  individuId,
  referentielId,
  unite,
  referentielNom,
  sousOnglet,
  onSousOngletChange,
  multi,
}: {
  indicateurId: string
  // Identifiant de la cellule courante (l'individu seul en mono-dimension).
  individuId: string
  referentielId: string
  unite: UniteIndicateurApiModel | null
  referentielNom: string | null
  sousOnglet: SousOnglet
  onSousOngletChange: (sousOnglet: SousOnglet) => void
  multi?: ResultatsMultiDimension | undefined
}) {
  // Synthèse multi-dimension : pairs sur le niveau de la première coordonnée,
  // autres coordonnées fixées (tranche).
  const syntheseTranche = multi
    ? tranche({ multi, dimension: multi.coordonnees[0]?.dimension ?? '' })
    : null

  return (
    <div className="space-y-8">
      <IndicateurSynthesePanel
        indicateurId={indicateurId}
        referentielId={referentielId}
        individuId={individuId}
        unite={unite}
        referentielNom={referentielNom}
        fixe={syntheseTranche?.fixe}
        libelleFixe={syntheseTranche?.libelle}
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
          {multi ? (
            <EvolutionMultiDimension
              indicateurId={indicateurId}
              celluleId={individuId}
              unite={unite}
              multi={multi}
            />
          ) : (
            <div className="space-y-10">
              <IndicateurValeursChart
                indicateurId={indicateurId}
                individuId={individuId}
                unite={unite}
              />
              {/* Données (referentiel, individus, valeurs remarquables) déjà
                  préfetchées par le loader de la route, et la carte est un import
                  statique : aucune suspension ici, donc pas de boundary. */}
              <IndicateurWidgets indicateurId={indicateurId} referentielId={referentielId} />
            </div>
          )}
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
