import { useSuspenseQuery } from '@tanstack/react-query'

import { WidgetRenderer } from '@/components/widgets/WidgetRenderer'
import { referentielQueryOptions } from '@/queries/referentiels'

/**
 * La maille de la carte est portée par le référentiel, qui déclare sa configuration de
 * cartographie. On réutilise `WidgetRenderer` plutôt que de dupliquer ce choix.
 */
export function CarteIndicateurAdapter({
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
