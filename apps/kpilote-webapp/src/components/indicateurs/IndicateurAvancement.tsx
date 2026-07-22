import { type UniteIndicateurApiModel } from '@pilote/kpilote-shared/indicateur'
import { useSuspenseQueries } from '@tanstack/react-query'

import { IndicateurProgression } from '@/components/indicateurs/IndicateurProgression'
import { formatMonthYearNumericFr, formatNumberAvecUniteFr } from '@/lib/format'
import { dernierValeurIndividuQueryOptions } from '@/queries/dernieresValeurs'
import { tauxProgressionIndividuQueryOptions } from '@/queries/tauxProgression'

export function IndicateurAvancementSkeleton() {
  return (
    <span
      className="flex animate-pulse flex-col gap-1"
      role="status"
      aria-label="Chargement de la valeur d'avancement"
    >
      <span className="h-6 w-16 rounded bg-border" />
      <span className="h-[18px] w-20 rounded bg-border" />
    </span>
  )
}

export function IndicateurAvancement({
  indicateurId,
  individuId,
  unite,
}: {
  indicateurId: string
  individuId: string
  unite: UniteIndicateurApiModel | null
}) {
  const [{ data }, { data: tauxData }] = useSuspenseQueries({
    queries: [
      dernierValeurIndividuQueryOptions(individuId, indicateurId),
      tauxProgressionIndividuQueryOptions(individuId, indicateurId),
    ],
  })
  if (!data) {
    return <span className="text-xs text-text-subtle">Pas de valeur</span>
  }
  return (
    <div className="flex flex-1 flex-col gap-1">
      <span className="text-2xl font-bold leading-none text-blue-cumulus">
        {formatNumberAvecUniteFr(data.valeur, unite)}
      </span>
      <span className="text-xs text-text-muted">{formatMonthYearNumericFr(data.date)}</span>
      {tauxData?.tauxProgression != null && (
        <div className="mt-auto pt-4">
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
