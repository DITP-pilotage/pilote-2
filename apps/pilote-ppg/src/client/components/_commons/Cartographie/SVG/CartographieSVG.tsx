import { FunctionComponent, useId, useRef, useState } from "react";
import { CodeInsee } from "@/server/domain/territoire/Territoire.interface";
import { HachuresDiagonales } from "@/client/constants/légendes/hachure/hachures";
import { estHachure } from "@/client/constants/légendes/hachure/hachure";
import {
  CartographieOptions,
  CartographieTerritoires,
  CartographieTerritoire,
} from "@/components/_commons/Cartographie/useCartographie.interface";
import SecureTooltip from "@/components/_commons/SecureTooltip/SecureTooltip";
import { MailleInterne } from "@/server/domain/maille/Maille.interface";
import CartographieZoomEtDéplacement from "./ZoomEtDéplacement/CartographieZoomEtDéplacement";
import { CartographieTerritoireSélectionné } from "./CartographieTerritoireSélectionné";
import { getTraceSvg } from "./CartographieSVGContrat";

interface CartographieSVGProps {
  territoireCode: string;
  options: CartographieOptions;
  territoires: CartographieTerritoires["territoires"];
  frontières: CartographieTerritoires["frontières"];
  auClicTerritoireCallback: (
    territoireCodeInsee: CodeInsee,
    territoireSélectionnable: boolean,
  ) => void;
  contoursGris?: boolean;
  mailleSelectionnee: MailleInterne;
}

export const CartographieSVG: FunctionComponent<CartographieSVGProps> = ({
  territoireCode,
  options,
  territoires,
  frontières,
  auClicTerritoireCallback,
  contoursGris = false,
  mailleSelectionnee,
}) => {
  const [hoveredTerritoire, setHoveredTerritoire] =
    useState<CartographieTerritoire | null>(null);
  const [hoveredElement, setHoveredElement] = useState<HTMLElement | null>(
    null,
  );
  const svgRef = useRef<SVGSVGElement | null>(null);
  const idHachures = useId();

  const territoiresHachurés = territoires.filter((territoire) =>
    estHachure(territoire.remplissage),
  );

  const viewbox = {
    x: 1,
    y: 0,
    width: 100,
    height: 100,
  };

  return (
    <div className="relative">
      {options.estInteractif ? (
        <CartographieZoomEtDéplacement svgRef={svgRef} viewbox={viewbox} />
      ) : null}
      <div
        className={`max-w-[25rem] mx-auto stroke-white ${contoursGris ? "stroke-dsfr-green-tilleul-verveine-sun" : ""}`}
      >
        <SecureTooltip
          anchorEl={hoveredElement}
          classNameInfoBulle="infobull--sm"
          isVisible={!!hoveredTerritoire}
        >
          {hoveredTerritoire ? (
            <div className="fr-text--sm">
              <p className="fr-text--sm fr-background-contrast-grey fr-p-2w">
                {hoveredTerritoire.libellé}
              </p>
              <div className="fr-text--sm fr-p-2w">
                {hoveredTerritoire.contenuInfoBulle}
              </div>
            </div>
          ) : null}
        </SecureTooltip>
        <svg
          ref={svgRef}
          version="1.2"
          viewBox="1 0 100 100"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {territoiresHachurés.map((territoire) => (
              <clipPath
                id={`${idHachures}-${territoire.codeInsee}`}
                key={`clip-${territoire.codeInsee}`}
              >
                {getTraceSvg(
                  territoire.code,
                  { key: `clip-tracé-${territoire.codeInsee}` },
                  mailleSelectionnee,
                )}
              </clipPath>
            ))}
          </defs>
          <g className="canvas">
            {territoires.map((territoire) =>
              getTraceSvg(
                territoire.code,
                {
                  className: `[stroke-width:0.15] hover:opacity-[0.72] ${options.estInteractif && territoire.estInteractif && territoire.estApplicable && "cursor-pointer"}`,
                  fill: estHachure(territoire.remplissage)
                    ? "#ffffff"
                    : territoire.remplissage,
                  key: `territoire-${territoire.codeInsee}`,
                  onClick: () => {
                    if (
                      territoire.estApplicable &&
                      options.estInteractif &&
                      territoire.estInteractif
                    ) {
                      auClicTerritoireCallback(
                        territoire.code,
                        options.territoireSélectionnable,
                      );
                    }
                  },
                  onMouseEnter: (e) => {
                    if (options.estInteractif) {
                      setHoveredTerritoire(territoire);
                      setHoveredElement(
                        e.currentTarget as unknown as HTMLElement,
                      );
                    }
                  },
                  onMouseLeave: () => {
                    setHoveredTerritoire(null);
                    setHoveredElement(null);
                  },
                },
                mailleSelectionnee,
              ),
            )}
            {territoiresHachurés.map((territoire) => (
              <g
                clipPath={`url(#${idHachures}-${territoire.codeInsee})`}
                key={`hachures-${territoire.codeInsee}`}
              >
                <HachuresDiagonales taille={viewbox.height} />
              </g>
            ))}
            {frontières.map((frontière) =>
              getTraceSvg(
                frontière.code,
                {
                  className: "fill-none [stroke-width:0.4]",
                  key: `frontière-${frontière.codeInsee}`,
                },
                mailleSelectionnee,
              ),
            )}
            {options.territoireSélectionnable ? (
              <CartographieTerritoireSélectionné
                mailleSelectionnee={mailleSelectionnee}
                territoireCode={territoireCode}
              />
            ) : null}
          </g>
        </svg>
      </div>
    </div>
  );
};
