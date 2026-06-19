import { type UniteIndicateurApiModel } from '@pilote/mb-shared/indicateur'
import { useSuspenseQuery } from '@tanstack/react-query'

import { formatMonthYearNumericFr, formatNumberAvecUniteFr } from '@/lib/format'
import { dernierValeurIndividuQueryOptions } from '@/queries/dernieresValeurs'
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
  const { data } = useSuspenseQuery(dernierValeurIndividuQueryOptions(individuId, indicateurId))
  if (!data) {
    return <span className="text-text-subtle">Pas de valeur</span>
  }
  return (
    <span className="flex flex-col gap-1">
      <span className="text-2xl font-bold leading-none text-primary">
        {formatNumberAvecUniteFr(data.valeur, unite)}
      </span>
      <span className="text-text-muted">au {formatMonthYearNumericFr(data.date)}</span>
      {data.tauxProgression !== null && <ProgressionBar taux={data.tauxProgression} />}
    </span>
  )
}
