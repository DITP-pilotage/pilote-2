import { type UniteIndicateurApiModel } from '@pilote/kpilote-shared/indicateur'
import { Suspense } from 'react'

import { SectionCommentaire } from '@/components/commentaires/SectionCommentaire'
import { RouteLoading } from '@/components/RouteLoading'
import { IndicateurCommentaireConfigProvider } from '@/components/indicateurs/commentaires/IndicateurCommentaireConfigProvider'
import { IndicateurSynthesePanel } from '@/components/indicateurs/IndicateurSynthesePanel'
import { IndicateurValeursChart } from '@/components/indicateurs/IndicateurValeursChart'
import { IndicateurWidgets } from '@/components/indicateurs/IndicateurWidgets'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@pilote/kpilote-ui/Tabs'

type SousOnglet = 'confiance' | 'evolution' | 'commentaire'

export function IndicateurResultatsTab({
  indicateurId,
  individuId,
  referentielId,
  unite,
  referentielNom,
  sousOnglet,
  onSousOngletChange,
}: {
  indicateurId: string
  individuId: string
  referentielId: string
  unite: UniteIndicateurApiModel | null
  referentielNom: string | null
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
        referentielNom={referentielNom}
      />

      <Tabs value={sousOnglet} onValueChange={(valeur) => onSousOngletChange(valeur as SousOnglet)}>
        <TabsList>
          <TabsTrigger value="confiance" className="text-xs">
            Niveau de confiance
          </TabsTrigger>
          <TabsTrigger value="evolution" className="text-xs">
            Evolution et répartition
          </TabsTrigger>
          <TabsTrigger value="commentaire" className="text-xs">
            Commentaire
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
            <IndicateurValeursChart
              indicateurId={indicateurId}
              individuId={individuId}
              unite={unite}
            />
            <IndicateurWidgets indicateurId={indicateurId} referentielId={referentielId} />
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
