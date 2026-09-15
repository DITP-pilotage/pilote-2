import { useSuspenseQuery } from '@tanstack/react-query'

import { IndicateurValeursChart } from '@/components/indicateurs/IndicateurValeursChart'
import { indicateurQueryOptions } from '@/queries/indicateurs'

/** Même dérivation que l'avancement : la courbe a besoin de l'unité pour son axe. */
export function CourbeIndicateurAdapter({
  indicateurId,
  individuId,
}: {
  indicateurId: string
  individuId: string
}) {
  const { data: indicateur } = useSuspenseQuery(indicateurQueryOptions(indicateurId))
  return (
    <IndicateurValeursChart
      indicateurId={indicateurId}
      individuId={individuId}
      unite={indicateur.unite}
    />
  )
}
