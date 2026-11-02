import { useSuspenseQuery } from '@tanstack/react-query'

import { WidgetRenderer } from '@/components/widgets/WidgetRenderer'
import { Card } from '@pilote/kpilote-ui/Card'
import { referentielQueryOptions } from '@/queries/referentiels'

type IndicateurWidgetsProps = {
  indicateurId: string
  referentielId: string
  // Indicateur multi-dimension : tranche et navigation (cf. CarteFranceWidget).
  fixe?: string | undefined
  onSelectIndividu?: ((individuId: string) => void) | undefined
  // Noms des membres fixés, ajoutés au titre de la carte.
  libelleTranche?: string | undefined
}

export function IndicateurWidgets({
  indicateurId,
  referentielId,
  fixe,
  onSelectIndividu,
  libelleTranche,
}: IndicateurWidgetsProps) {
  const { data: referentiel } = useSuspenseQuery(referentielQueryOptions(referentielId))

  if (referentiel.widgets.length === 0) return null

  return (
    <div className="space-y-6">
      {referentiel.widgets.map((widget) => (
        <Card
          key={widget.id}
          kicker={libelleTranche ? `${widget.nom} · ${libelleTranche}` : widget.nom}
        >
          <WidgetRenderer
            widget={widget}
            indicateurId={indicateurId}
            referentielId={referentielId}
            fixe={fixe}
            onSelectIndividu={onSelectIndividu}
          />
        </Card>
      ))}
    </div>
  )
}
