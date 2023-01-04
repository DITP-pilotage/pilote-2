import { MutableRefObject } from 'react';
import {
  Viewbox,
} from '@/components/_commons/Cartographie/CartographieAffichage/CartographieSVG/CartographieSVG.interface';

export default interface CartographieZoomEtDéplacementProps {
  svgRef: MutableRefObject<SVGSVGElement | null>
  viewbox: Viewbox
}
