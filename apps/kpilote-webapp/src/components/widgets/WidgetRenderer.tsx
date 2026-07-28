import { type WidgetApiModel } from '@pilote/kpilote-shared/widget'

import { CarteFranceWidget } from '@/components/widgets/CarteFranceWidget'
import {
  franceDepartementsFrontieresGeoJsonQueryOptions,
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
      frontieresQueryOptions={franceDepartementsFrontieresGeoJsonQueryOptions()}
    />
  ),
  'carte-france-regions': (props) => (
    <CarteFranceWidget
      {...props}
      mapName="france-regions"
      geoJsonQueryOptions={franceRegionsGeoJsonQueryOptions()}
      frontieresQueryOptions={franceRegionsGeoJsonQueryOptions()}
    />
  ),
}

export function WidgetRenderer(props: WidgetRendererProps) {
  const renderer = RENDERERS[props.widget.type]
  if (!renderer) return null
  return <>{renderer(props)}</>
}
