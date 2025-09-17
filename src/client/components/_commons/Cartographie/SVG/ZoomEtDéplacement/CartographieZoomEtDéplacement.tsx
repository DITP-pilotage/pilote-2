import {
  useCallback,
  useMemo,
  useEffect,
  FunctionComponent,
  MutableRefObject,
} from "react";
import { select as d3Select } from "d3-selection";
import { zoom as d3Zoom } from "d3-zoom";
import { Viewbox } from "@/components/_commons/Cartographie/SVG/CartographieSVG.interface";
import { Icone } from "@/components/_commons/Icone";
import { AddLineIcon } from "@/components/_commons/Icones/AddLineIcon";
import { SubtractLineIcon } from "@/components/_commons/Icones/SubtractLineIcon";

interface CartographieZoomEtDéplacementProps {
  svgRef: MutableRefObject<SVGSVGElement | null>;
  viewbox: Viewbox;
}

const ZOOM_MAXIMUM = 10;
const MULTIPLICATEUR_AU_ZOOM = 1.5;

const CartographieZoomEtDéplacement: FunctionComponent<
  CartographieZoomEtDéplacementProps
> = ({ svgRef, viewbox }) => {
  const svg = svgRef.current;
  const canvas = useMemo(() => d3Select(svg).selectChild(".canvas"), [svg]);

  const auZoomCallback = useCallback(
    (évènement: { transform: string | null }) =>
      canvas.attr("transform", évènement.transform),
    [canvas],
  );

  const zoom = useMemo(
    () =>
      d3Zoom<SVGSVGElement, unknown>()
        .translateExtent([
          [viewbox.x, viewbox.y],
          [viewbox.x + viewbox.width, viewbox.y + viewbox.height],
        ])
        .scaleExtent([1, ZOOM_MAXIMUM])
        .on("zoom", auZoomCallback),
    [viewbox, auZoomCallback],
  );

  const zoomer = useCallback(
    (multiplicateur: number) => {
      if (svg) d3Select(svg).call(zoom.scaleBy, multiplicateur);
    },
    [svg, zoom.scaleBy],
  );

  useEffect(() => {
    if (svg) d3Select<SVGSVGElement, unknown>(svg).call(zoom);
  }, [svg, zoom]);

  return (
    <div className="absolute right-0 w-8">
      <button
        className="flex justify-center !p-0.5 text-primary bg-white border-2 border-gray-300 rounded-t-lg shadow-[0_1px_1px_rgba(0,0,0,0.16),0_1px_0_-2px_rgba(0,0,0,0.16),0_1px_4px_rgba(0,0,0,0.23)]"
        onClick={() => zoomer(MULTIPLICATEUR_AU_ZOOM)}
        type="button"
      >
        <Icone icone={AddLineIcon} />
      </button>
      <button
        className="flex justify-center !p-0.5 text-primary bg-white border-2 border-gray-300 rounded-b-lg shadow-[0_1px_1px_rgba(0,0,0,0.16),0_1px_0_-2px_rgba(0,0,0,0.16),0_1px_4px_rgba(0,0,0,0.23)]"
        onClick={() => zoomer(1 / MULTIPLICATEUR_AU_ZOOM)}
        type="button"
      >
        <Icone icone={SubtractLineIcon} />
      </button>
    </div>
  );
};

export default CartographieZoomEtDéplacement;
