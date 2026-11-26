import { type SensSouhaite, type UniteIndicateurApiModel } from '@pilote/kpilote-shared/indicateur'
import { useSuspenseQueries } from '@tanstack/react-query'

import { IndicateurCardIndividu } from '@/components/indicateurs/IndicateurCardIndividu'
import { IndicateurCardValeur } from '@/components/indicateurs/IndicateurCardValeur'
import { IndicateurCardVariation } from '@/components/indicateurs/IndicateurCardVariation'
import { IndicateurProgression } from '@/components/indicateurs/IndicateurProgression'
import { type ReferentielGroup } from '@/lib/individus/hierarchy'
import { derniereValeurQueryOptions } from '@/queries/dernieresValeurs'
import { dernierTauxProgressionQueryOptions } from '@/queries/tauxProgression'

export function IndicateurAvancementSkeleton() {
  return (
    <span
      className="flex animate-pulse flex-col gap-4"
      role="status"
      aria-label="Chargement de la valeur d'avancement"
    >
      <span className="h-5 w-32 rounded bg-border" />
      <span className="flex flex-col gap-1">
        <span className="h-8 w-24 rounded bg-border" />
        <span className="h-4 w-28 rounded bg-border" />
      </span>
      <span className="flex flex-col gap-1">
        <span className="h-4 w-20 rounded bg-border" />
        <span className="h-5 w-36 rounded bg-border" />
        <span className="h-5 w-40 rounded bg-border" />
      </span>
    </span>
  )
}

export function IndicateurAvancement({
  indicateurId,
  individus,
  unite,
  sensSouhaite,
  groups,
  selectedIndividuId,
}: {
  indicateurId: string
  individus: ReadonlyArray<string> | undefined
  unite: UniteIndicateurApiModel | null
  sensSouhaite: SensSouhaite
  groups: ReadonlyArray<ReferentielGroup>
  // Individu sur lequel la carte est lue (sélection ou racine), connu même sans valeur.
  selectedIndividuId: string | undefined
}) {
  const [{ data: derniereValeur }, { data: tauxData }] = useSuspenseQueries({
    queries: [
      derniereValeurQueryOptions({ individus, indicateurId }),
      dernierTauxProgressionQueryOptions({ individus, indicateurId }),
    ],
  })
  return (
    <div className="flex flex-1 flex-col gap-4">
      <IndicateurCardIndividu
        groups={groups}
        individuId={derniereValeur?.individu ?? selectedIndividuId}
      />
      <IndicateurCardValeur derniereValeur={derniereValeur} unite={unite} />
      <IndicateurCardVariation
        derniereValeur={derniereValeur}
        unite={unite}
        sensSouhaite={sensSouhaite}
      />
      {tauxData != null && (
        <div className="mt-auto">
          <IndicateurProgression
            taux={tauxData.tauxProgression}
            valeurCible={tauxData.valeurCible}
            dateCible={tauxData.dateCible}
            unite={unite}
          />
        </div>
      )}
    </div>
  )
}
