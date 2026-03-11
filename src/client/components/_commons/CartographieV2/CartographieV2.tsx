import {
  FunctionComponent,
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { select as d3Select } from "d3-selection";
import { zoom as d3Zoom } from "d3-zoom";
import { MailleInterne } from "@/server/domain/maille/Maille.interface";
import hachuresGrisBlanc from "@/client/constants/légendes/hachure/hachuresGrisBlanc";
import SecureTooltip from "@/components/_commons/SecureTooltip/SecureTooltip";
import { Icone } from "@/components/_commons/Icone";
import { AddLineIcon } from "@/components/_commons/Icones/AddLineIcon";
import { SubtractLineIcon } from "@/components/_commons/Icones/SubtractLineIcon";
import { getTraceSvg } from "@/components/_commons/Cartographie/SVG/CartographieSVGContrat";
import { listeTerritoires } from "@/client/constants/territoires";

type CartographieV2Donnee = {
  remplissage: string;
  libelle: string;
  contenuInfoBulle?: ReactNode;
};

type CartographieV2Props = {
  maille: MailleInterne;
  donnees: Record<string, CartographieV2Donnee>;
  territoiresSelectionnes?: string[];
  auClicTerritoire?: (territoireCode: string) => void;
  children?: ReactNode;
};

const ZOOM_MAXIMUM = 10;
const MULTIPLICATEUR_AU_ZOOM = 1.5;
const VIEWBOX = { x: 1, y: 0, width: 100, height: 100 };

export const CartographieV2: FunctionComponent<CartographieV2Props> = ({
  maille,
  donnees,
  territoiresSelectionnes,
  auClicTerritoire,
  children,
}) => {
  const territoiresAffiches =
    maille === "departementale"
      ? listeTerritoires.départements
      : listeTerritoires.régions;

  const svgRef = useRef<SVGSVGElement | null>(null);
  const [hoveredCode, setHoveredCode] = useState<string | null>(null);
  const [hoveredElement, setHoveredElement] = useState<HTMLElement | null>(
    null,
  );

  const hoveredDonnee = hoveredCode ? donnees[hoveredCode] : null;
  const hoveredTerritoire = hoveredCode
    ? territoiresAffiches.find((territoire) => territoire.code === hoveredCode)
    : null;

  const svg = svgRef.current;
  const canvas = useMemo(() => d3Select(svg).selectChild(".canvas"), [svg]);

  const auZoomCallback = useCallback(
    (event: { transform: string | null }) =>
      canvas.attr("transform", event.transform),
    [canvas],
  );

  const zoom = useMemo(
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

  return (
    <div className="relative">
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

      <SecureTooltip
        anchorEl={hoveredElement}
        classNameInfoBulle="infobull--sm"
        isVisible={!!hoveredTerritoire}
      >
        {hoveredTerritoire ? (
          <div className="fr-text--sm">
            <p className="fr-text--sm fr-background-contrast-grey fr-p-2w">
              {hoveredDonnee?.libelle ?? hoveredTerritoire.nom}
            </p>
            {hoveredDonnee?.contenuInfoBulle ? (
              <div className="fr-text--sm fr-p-2w">
                {hoveredDonnee.contenuInfoBulle}
              </div>
            ) : null}
          </div>
        ) : null}
      </SecureTooltip>

      <svg
        ref={svgRef}
        version="1.2"
        viewBox="1 0 100 100"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>{hachuresGrisBlanc.patternSVG}</defs>
        <g className="canvas">
          {territoiresAffiches.map((territoire) => {
            const donnee = donnees[territoire.code];
            return getTraceSvg(
              territoire.code,
              {
                key: territoire.code,
                className: auClicTerritoire
                  ? "cursor-pointer hover:opacity-70"
                  : "",
                fill: donnee?.remplissage ?? "#e0e0e0",
                onClick: () => auClicTerritoire?.(territoire.code),
                onMouseEnter: (event) => {
                  setHoveredCode(territoire.code);
                  setHoveredElement(
                    event.currentTarget as unknown as HTMLElement,
                  );
                },
                onMouseLeave: () => {
                  setHoveredCode(null);
                  setHoveredElement(null);
                },
              },
              maille,
            );
          })}
          {territoiresSelectionnes?.map((code) =>
            getTraceSvg(
              code,
              {
                key: `sel-${code}`,
                className:
                  "fill-none stroke-[var(--yellow-moutarde-850-200)] stroke-[0.5] pointer-events-none",
              },
              maille,
            ),
          )}
        </g>
      </svg>

      {children}
    </div>
  );
};
