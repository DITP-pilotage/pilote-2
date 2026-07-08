import { type UniteIndicateurApiModel } from '@pilote/kpilot-shared/indicateur'
import { useSuspenseQueries } from '@tanstack/react-query'

import { formatMonthYearNumericFr, formatNumberAvecUniteFr } from '@/lib/format'
import { dernierValeurIndividuQueryOptions } from '@/queries/dernieresValeurs'
import { tauxProgressionIndividuQueryOptions } from '@/queries/tauxProgression'
import { ProgressionBar } from '@/components/ui/ProgressionBar'

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
    return <span className="text-text-subtle">Pas de valeur</span>
  }
  return (
    <div className="flex flex-col gap-1">
      <span className="text-2xl font-bold leading-none text-primary">
        {formatNumberAvecUniteFr(data.valeur, unite)}
      </span>
      <span className="text-text-muted">au {formatMonthYearNumericFr(data.date)}</span>
      {tauxData?.tauxProgression != null && (
        <ProgressionBar
          taux={tauxData.tauxProgression}
          valeurCible={tauxData.valeurCible}
          unite={unite}
        />
      )}
    </div>
  )
}
