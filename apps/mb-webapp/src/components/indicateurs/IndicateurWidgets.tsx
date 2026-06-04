import { useSuspenseQuery } from '@tanstack/react-query'

import { WidgetRenderer } from '@/components/widgets/WidgetRenderer'
import { Card } from '@/components/ui/Card'
import { referentielQueryOptions } from '@/queries/referentiels'

type IndicateurWidgetsProps = {
  indicateurId: string
  referentielId: string
}

export function IndicateurWidgets({ indicateurId, referentielId }: IndicateurWidgetsProps) {
  const { data: referentiel } = useSuspenseQuery(referentielQueryOptions(referentielId))

  if (referentiel.widgets.length === 0) return null

  return (
    <div className="space-y-6">
      {referentiel.widgets.map((widget) => (
        <Card key={widget.id} kicker={widget.nom}>
          <WidgetRenderer
            widget={widget}
            indicateurId={indicateurId}
            referentielId={referentielId}
          />
        </Card>
      ))}
    </div>
  )
}
