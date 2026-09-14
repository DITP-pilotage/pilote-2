import { ReactNode, useCallback, useId, useState } from "react";
import { MailleInterne } from "@/server/domain/maille/Maille.interface";
import { HachuresDiagonales } from "@/client/constants/légendes/hachure/hachures";
import { estHachure } from "@/client/constants/légendes/hachure/hachure";
import { getTraceSvg } from "@/components/_commons/Cartographie/SVG/CartographieSVGContrat";
import SecureTooltip from "@/components/_commons/SecureTooltip/SecureTooltip";
import { getListeTerritoires } from "@/client/constants/territoires";
import { clsxm } from "@/utils/clsxm";
import { CartographieV2Donnee, GetTerritoireProps } from "./types";
import { CarteDepartements } from "./CarteDepartements";
import { CarteRegions } from "./CarteRegions";
import { FrontieresRegions } from "./FrontieresRegions";
import { ContoursTerritoiresSelectionnes } from "./ContoursTerritoiresSelectionnes";

type CartographieV2Props = {
  maille: MailleInterne;
  donnees: Record<string, CartographieV2Donnee>;
  territoiresSelectionnes?: string[];
  onTerritoireSelect?: (territoireCode: string) => void;
  children?: ReactNode;
};

export const CartographieV2 = ({
  maille,
  donnees,
  territoiresSelectionnes,
  onTerritoireSelect,
  children,
}: CartographieV2Props) => {
  const territoiresAffiches = getListeTerritoires(maille);
  const [hovered, setHovered] = useState<{
    code: string;
    element: HTMLElement;
  } | null>(null);

  const idHachures = useId();
  const codesTerritoiresHachures = Object.entries(donnees)
    .filter(([, donnee]) => estHachure(donnee.remplissage))
    .map(([code]) => code);

  const hoveredDonnee = hovered?.code ? donnees[hovered.code] : null;
  const hoveredTerritoire = hovered
    ? territoiresAffiches.find(
        (territoire) => territoire.code === hovered?.code,
      )
    : null;

  const getTerritoireProps: GetTerritoireProps = useCallback(
    (territoire) => ({
      key: territoire.code,
      className: clsxm(onTerritoireSelect && "cursor-pointer hover:opacity-70"),
      style: { stroke: "var(--grey-1000-50)", strokeWidth: 0.15 },
      fill: estHachure(donnees[territoire.code]?.remplissage ?? "")
        ? "#ffffff"
        : (donnees[territoire.code]?.remplissage ?? "#e0e0e0"),
      onClick: () => onTerritoireSelect?.(territoire.code),
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
    [donnees, onTerritoireSelect],
  );

  return (
    <div className="relative">
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
        version="1.2"
        viewBox="1 0 100 100"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {codesTerritoiresHachures.map((territoireCode) => (
            <clipPath
              id={`${idHachures}-${territoireCode}`}
              key={territoireCode}
            >
              {getTraceSvg(
                territoireCode,
                { key: `clip-tracé-${territoireCode}` },
                maille,
              )}
            </clipPath>
          ))}
        </defs>
        <g className="canvas">
          {maille === "departementale" ? (
            <CarteDepartements getTerritoireProps={getTerritoireProps} />
          ) : (
            <CarteRegions getTerritoireProps={getTerritoireProps} />
          )}
          {codesTerritoiresHachures.map((territoireCode) => (
            <g
              clipPath={`url(#${idHachures}-${territoireCode})`}
              key={`hachures-${territoireCode}`}
            >
              <HachuresDiagonales taille={100} />
            </g>
          ))}
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
