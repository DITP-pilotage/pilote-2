import { useCallback, useMemo, useEffect, FunctionComponent, MutableRefObject } from 'react';
import { select as d3Select } from 'd3-selection';
import { zoom as d3Zoom } from 'd3-zoom';
import { Viewbox } from '@/components/_commons/Cartographie/SVG/CartographieSVG.interface';
import CartographieZoomEtDéplacementStyled from './CartographieZoomEtDéplacement.styled';

interface CartographieZoomEtDéplacementProps {
  svgRef: MutableRefObject<SVGSVGElement | null>
  viewbox: Viewbox
}

const ZOOM_MAXIMUM = 10;
const MULTIPLICATEUR_AU_ZOOM = 1.5;

const CartographieZoomEtDéplacement: FunctionComponent<CartographieZoomEtDéplacementProps> = ({ svgRef, viewbox }) => {
  const svg = svgRef.current;
  const canvas = useMemo(() => d3Select(svg).selectChild('.canvas'), [svg]);

  const auZoomCallback = useCallback((évènement: any) => (
    canvas.attr('transform', évènement.transform)
  ), [canvas]);

  const zoom = useMemo(() => (
    d3Zoom<SVGSVGElement, unknown>()
      .translateExtent([[viewbox.x, viewbox.y], [viewbox.x + viewbox.width, viewbox.y + viewbox.height]])
      .scaleExtent([1, ZOOM_MAXIMUM]).on('zoom', auZoomCallback)
  ), [viewbox, auZoomCallback]);

  const zoomer = useCallback((multiplicateur: number) => {
    if (svg)
      d3Select(svg).call(zoom.scaleBy, multiplicateur);
  }, [svg, zoom.scaleBy]);

  useEffect(() => {
    if (svg)
      d3Select<SVGSVGElement, unknown>(svg).call(zoom);
  }, [svg, zoom]);

  return (
    <CartographieZoomEtDéplacementStyled>
      <button
        className='zoom-plus fr-btn'
        onClick={() => zoomer(MULTIPLICATEUR_AU_ZOOM)}
        type='button'
      >
        <span className='fr-icon-add-line' />
      </button>
      <button
        className='zoom-moins fr-btn'
        onClick={() => zoomer(1 / MULTIPLICATEUR_AU_ZOOM)}
        type='button'
      >
        <span className='fr-icon-subtract-line' />
      </button>
    </CartographieZoomEtDéplacementStyled>
  );
};

export default CartographieZoomEtDéplacement;
