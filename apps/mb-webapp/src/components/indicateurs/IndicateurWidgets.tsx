import { useSuspenseQuery } from '@tanstack/react-query'

import { WidgetRenderer } from '@/components/widgets/WidgetRenderer'
import { referentielQueryOptions } from '@/queries/referentiels'

type IndicateurWidgetsProps = {
  indicateurId: string
  referentielId: string
}

export function IndicateurWidgets({ indicateurId, referentielId }: IndicateurWidgetsProps) {
  const { data: referentiel } = useSuspenseQuery(referentielQueryOptions(referentielId))

  if (referentiel.widgets.length === 0) return null

  return (
    <div className="space-y-4">
      {referentiel.widgets.map((widget) => (
        <div key={widget.id} className="rounded-lg border border-border bg-surface p-4">
          <h3 className="mb-2 text-base font-medium">{widget.nom}</h3>
          <WidgetRenderer
            widget={widget}
            indicateurId={indicateurId}
            referentielId={referentielId}
          />
        </div>
      ))}
    </div>
  )
}
