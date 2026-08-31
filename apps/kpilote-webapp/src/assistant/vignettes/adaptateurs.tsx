import { useSuspenseQuery } from '@tanstack/react-query'

import { IndicateurAvancement } from '@/components/indicateurs/IndicateurAvancement'
import { IndicateurValeursChart } from '@/components/indicateurs/IndicateurValeursChart'
import { WidgetRenderer } from '@/components/widgets/WidgetRenderer'
import { indicateurQueryOptions } from '@/queries/indicateurs'
import { referentielQueryOptions } from '@/queries/referentiels'

// La plupart des composants se branchent directement : ils ne prennent que des références et
// chargent leurs propres données. Seuls ceux qui exigent une prop dérivée ont besoin d'un
// adaptateur, et il tient en quelques lignes.

export function AdaptateurAvancementIndicateur({
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

export function AdaptateurCourbeIndicateur({
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

/**
 * La maille de la carte est portée par le référentiel, qui déclare sa configuration de
 * cartographie. On réutilise `WidgetRenderer` plutôt que de dupliquer ce choix.
 */
export function AdaptateurCarteIndicateur({
  indicateurId,
  referentielId,
}: {
  indicateurId: string
  referentielId: string
}) {
  const { data: referentiel } = useSuspenseQuery(referentielQueryOptions(referentielId))
  const widget = referentiel.widgets[0]
  if (!widget) return null
  return (
    <WidgetRenderer widget={widget} indicateurId={indicateurId} referentielId={referentielId} />
  )
}
