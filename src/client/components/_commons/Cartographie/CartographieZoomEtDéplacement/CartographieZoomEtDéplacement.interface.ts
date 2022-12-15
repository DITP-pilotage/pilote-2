import { MutableRefObject } from 'react';

export default interface CartographieZoomEtDéplacementProps {
  svgRef: MutableRefObject<SVGSVGElement | null>
  svgGRef: MutableRefObject<SVGSVGElement | null>
  conteneurRef: MutableRefObject<HTMLDivElement | null>
}
