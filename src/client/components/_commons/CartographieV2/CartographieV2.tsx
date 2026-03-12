import { FunctionComponent, ReactNode, useCallback, useState } from "react";
import { MailleInterne } from "@/server/domain/maille/Maille.interface";
import hachuresGrisBlanc from "@/client/constants/légendes/hachure/hachuresGrisBlanc";
import SecureTooltip from "@/components/_commons/SecureTooltip/SecureTooltip";
import { getListeTerritoires } from "@/client/constants/territoires";
import { clsxm } from "@/utils/clsxm";
import {
  CartographieV2Donnee,
  GetTerritoireProps,
} from "./CartographieV2.types";
import { useZoomContext, ZoomControl, ZoomProvider } from "./ZoomContext";
import { CarteDepartements } from "./CarteDepartements";
import { CarteRegions } from "./CarteRegions";
import { FrontieresRegions } from "./FrontieresRegions";
import { ContoursTerritoiresSelectionnes } from "./ContoursTerritoiresSelectionnes";

type CartographieV2Props = {
  maille: MailleInterne;
  donnees: Record<string, CartographieV2Donnee>;
  territoiresSelectionnes?: string[];
  auClicTerritoire?: (territoireCode: string) => void;
  children?: ReactNode;
};

const CartographieV2Contenu: FunctionComponent<
  Omit<CartographieV2Props, "children"> & { children?: ReactNode }
> = ({
  maille,
  donnees,
  territoiresSelectionnes,
  auClicTerritoire,
  children,
}) => {
  const { svgRef } = useZoomContext();
  const territoiresAffiches = getListeTerritoires(maille);
  const [hovered, setHovered] = useState<{
    code: string;
    element: HTMLElement;
  } | null>(null);

  const hoveredDonnee = hovered?.code ? donnees[hovered.code] : null;
  const hoveredTerritoire = hovered
    ? territoiresAffiches.find(
        (territoire) => territoire.code === hovered?.code,
      )
    : null;

  const getTerritoireProps: GetTerritoireProps = useCallback(
    (territoire) => ({
      key: territoire.code,
      className: clsxm(
        "stroke-[var(--grey-1000-50)] stroke-[0.15]",
        auClicTerritoire && "cursor-pointer hover:opacity-70",
      ),
      fill: donnees[territoire.code]?.remplissage ?? "#e0e0e0",
      onClick: () => auClicTerritoire?.(territoire.code),
      onMouseEnter: (event) => {
        setHovered({
          code: territoire.code,
          element: event.currentTarget as unknown as HTMLElement,
        });
      },
      onMouseLeave: () => {
        setHovered(null);
      },
    }),
    [donnees, auClicTerritoire],
  );

  return (
    <div className="relative">
      <ZoomControl />

      <SecureTooltip
        anchorEl={hovered?.element ?? null}
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
          {maille === "departementale" ? (
            <CarteDepartements getTerritoireProps={getTerritoireProps} />
          ) : (
            <CarteRegions getTerritoireProps={getTerritoireProps} />
          )}
          {maille === "departementale" && <FrontieresRegions />}
          {territoiresSelectionnes && territoiresSelectionnes.length > 0 && (
            <ContoursTerritoiresSelectionnes
              maille={maille}
              territoiresCodes={territoiresSelectionnes}
            />
          )}
        </g>
      </svg>

      {children}
    </div>
  );
};

export const CartographieV2: FunctionComponent<CartographieV2Props> = (
  props,
) => {
  return (
    <ZoomProvider>
      <CartographieV2Contenu {...props} />
    </ZoomProvider>
  );
};
