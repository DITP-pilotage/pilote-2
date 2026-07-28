import { type WidgetApiModel } from '@pilote/kpilote-shared/widget'

import {
  franceDepartementsFrontieresGeoJson,
  franceDepartementsGeoJson,
  franceRegionsGeoJson,
} from '@/assets/maps'
import { CarteFranceWidget } from '@/components/widgets/CarteFranceWidget'

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
      geoJson={franceDepartementsGeoJson}
      frontieres={franceDepartementsFrontieresGeoJson}
    />
  ),
  'carte-france-regions': (props) => (
    <CarteFranceWidget
      {...props}
      mapName="france-regions"
      geoJson={franceRegionsGeoJson}
      frontieres={franceRegionsGeoJson}
    />
  ),
}

export function WidgetRenderer(props: WidgetRendererProps) {
  const renderer = RENDERERS[props.widget.type]
  if (!renderer) return null
  return <>{renderer(props)}</>
}
