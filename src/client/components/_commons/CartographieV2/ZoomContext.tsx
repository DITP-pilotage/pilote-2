import {
  createContext,
  FunctionComponent,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
} from "react";
import { select as d3Select } from "d3-selection";
import { zoom as d3Zoom, ZoomBehavior } from "d3-zoom";
import { Icone } from "@/components/_commons/Icone";
import { AddLineIcon } from "@/components/_commons/Icones/AddLineIcon";
import { SubtractLineIcon } from "@/components/_commons/Icones/SubtractLineIcon";

const ZOOM_MAXIMUM = 10;
const MULTIPLICATEUR_AU_ZOOM = 1.5;
export const VIEWBOX = { x: 1, y: 0, width: 100, height: 100 };

type ZoomContextValue = {
  svgRef: React.RefObject<SVGSVGElement | null>;
  zoomer: (multiplicateur: number) => void;
};

const ZoomCtx = createContext<ZoomContextValue | null>(null);

export const useZoomContext = (): ZoomContextValue => {
  const ctx = useContext(ZoomCtx);
  if (!ctx) throw new Error("useZoomContext must be used within ZoomProvider");
  return ctx;
};

export const ZoomProvider: FunctionComponent<{ children: ReactNode }> = ({
  children,
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const svg = svgRef.current;
  const canvas = useMemo(() => d3Select(svg).selectChild(".canvas"), [svg]);

  const auZoomCallback = useCallback(
    (event: { transform: string | null }) =>
      canvas.attr("transform", event.transform),
    [canvas],
  );

  const zoom: ZoomBehavior<SVGSVGElement, unknown> = useMemo(
    () =>
      d3Zoom<SVGSVGElement, unknown>()
        .translateExtent([
          [VIEWBOX.x, VIEWBOX.y],
          [VIEWBOX.x + VIEWBOX.width, VIEWBOX.y + VIEWBOX.height],
        ])
        .scaleExtent([1, ZOOM_MAXIMUM])
        .on("zoom", auZoomCallback),
    [auZoomCallback],
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

  const value = useMemo(() => ({ svgRef, zoomer }), [zoomer]);

  return <ZoomCtx.Provider value={value}>{children}</ZoomCtx.Provider>;
};

export const ZoomControl: FunctionComponent = () => {
  const { zoomer } = useZoomContext();

  return (
    <div className="absolute right-0 z-10 w-8">
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
