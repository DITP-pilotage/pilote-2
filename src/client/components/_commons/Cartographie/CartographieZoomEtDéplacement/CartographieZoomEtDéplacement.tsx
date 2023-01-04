import { useCallback, useMemo, useEffect } from 'react';
import { select as d3Select } from 'd3-selection';
import { zoom as d3Zoom } from 'd3-zoom';
import { useParentSize } from '@cutting/use-get-parent-size';
import CartographieZoomEtDéplacementProps from './CartographieZoomEtDéplacement.interface';

const ZOOM_MAXIMUM = 10;
const MULTIPLICATEUR_AU_ZOOM = 1.5;

export default function CartographieZoomEtDéplacement({ svgRef, svgGRef, conteneurRef }: CartographieZoomEtDéplacementProps) {
  const conteneurDimensions = useParentSize(conteneurRef);

  const handleZoom = useCallback((e: any) => d3Select(svgGRef.current).attr('transform', e.transform), [svgGRef]);

  const zoom = useMemo(() => 
    d3Zoom<SVGSVGElement, unknown>()
      .translateExtent([[0, 0], [conteneurDimensions.width, conteneurDimensions.height]])
      .scaleExtent([1, ZOOM_MAXIMUM]).on('zoom', handleZoom)
  , [conteneurDimensions.width, conteneurDimensions.height, handleZoom]);

  const zoomIn = useCallback(() => d3Select<SVGSVGElement, unknown>(svgRef.current as SVGSVGElement).call(zoom.scaleBy, MULTIPLICATEUR_AU_ZOOM), [svgRef, zoom.scaleBy]);
  const zoomOut = useCallback(() => d3Select<SVGSVGElement, unknown>(svgRef.current as SVGSVGElement).call(zoom.scaleBy, (1 / MULTIPLICATEUR_AU_ZOOM)), [svgRef, zoom.scaleBy]);
    
  useEffect(() => {
    d3Select<SVGSVGElement, unknown>(svgRef.current as SVGSVGElement).call(zoom);
  }, [svgRef, zoom]);

  return (
    <div className='fr-mb-1w'>
      <button
        className='fr-btn fr-mr-3w'
        onClick={zoomIn}
        type="button"
      >
        Zoomer
      </button>
      <button
        className='fr-btn'
        onClick={zoomOut}
        type="button"
      >
        Dézoomer
      </button>
    </div>
  );
}
