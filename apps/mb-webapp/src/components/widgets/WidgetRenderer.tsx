import { type WidgetApiModel } from '@pilote/mb-shared/widget'

import { CarteFranceWidget } from '@/components/widgets/CarteFranceWidget'
import {
  franceDepartementsGeoJsonQueryOptions,
  franceRegionsGeoJsonQueryOptions,
} from '@/queries/geoJson'

type WidgetRendererProps = {
  widget: WidgetApiModel
  indicateurId: string
  referentielId: string
}

const RENDERERS: Record<string, (props: WidgetRendererProps) => React.ReactNode> = {
  'carte-france-departements': (props) => (
    <CarteFranceWidget
      {...props}
      mapName="france-departements"
      geoJsonQueryOptions={franceDepartementsGeoJsonQueryOptions()}
    />
  ),
  'carte-france-regions': (props) => (
    <CarteFranceWidget
      {...props}
      mapName="france-regions"
      geoJsonQueryOptions={franceRegionsGeoJsonQueryOptions()}
    />
  ),
}

export function WidgetRenderer(props: WidgetRendererProps) {
  const renderer = RENDERERS[props.widget.type]
  if (!renderer) return null
  return <>{renderer(props)}</>
}
