import { useSuspenseQuery } from '@tanstack/react-query'

import { IndicateurAvancement } from '@/components/indicateurs/IndicateurAvancement'
import { indicateurQueryOptions } from '@/queries/indicateurs'

/** `IndicateurAvancement` exige l'unité, qui n'est lisible que sur l'indicateur lui-même. */
export function AvancementIndicateurAdapter({
  indicateurId,
  individuId,
}: {
  indicateurId: string
  individuId: string
}) {
  const { data: indicateur } = useSuspenseQuery(indicateurQueryOptions(indicateurId))
  return (
    <IndicateurAvancement
      indicateurId={indicateurId}
      individuId={individuId}
      unite={indicateur.unite}
    />
  )
}
