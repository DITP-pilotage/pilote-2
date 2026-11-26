import { Fragment, useMemo } from "react";
import { getCouleurTerritoireParCode } from "@/client/utils/couleur/paletteTerritoires";
import { getLabelTerritoire } from "@/client/constants/territoires";
import { useMesureWidget } from "@/components/_commons/Widget/TuileWidget/useMesureWidget";
import { TerritoireLabel } from "@/components/_commons/Widget/TerritoireLabel";
import { clsxm } from "@/utils/clsxm";
import {
  compareTerritoires,
  formatDateDerniereValeur,
  formatMiseAJourAttendueDepuis,
  isChantierMode,
  NonAJourMode,
  TerritoireNonAJour,
} from "./nonAJourDisplay";

const CelluleDouble = ({ children }: { children: string }) => (
  <div className="col-span-2 py-2 flex items-center justify-center border-b">
    {children}
  </div>
);

const Cellule = ({
  children,
  className,
}: {
  children: string | number;
  className?: string;
}) => (
  <div
    className={clsxm(
      "py-2 flex items-center justify-center border-b",
      className,
    )}
  >
    {children}
  </div>
);

const Cells = ({ territoire }: { territoire: TerritoireNonAJour }) => {
  if (territoire.etat === "NON_APPLICABLE") {
    return <CelluleDouble>Non applicable</CelluleDouble>;
  }
  if (isChantierMode(territoire)) {
    if (territoire.etat === "A_JOUR") {
      return <CelluleDouble>À jour</CelluleDouble>;
    }
    return (
      <>
        <Cellule>{territoire.nbIndicateursNonAJour}</Cellule>
        <Cellule>{territoire.nbIndicateursSansDonnee}</Cellule>
      </>
    );
  }
  return (
    <>
      <Cellule>{formatDateDerniereValeur(territoire)}</Cellule>
      <Cellule
        className={clsxm({
          "text-dsfr-warning-425 font-bold": territoire.etat === "NON_A_JOUR",
        })}
      >
        {territoire.etat === "A_JOUR"
          ? "À jour"
          : formatMiseAJourAttendueDepuis(territoire)}
      </Cellule>
    </>
  );
};

export const TerritoiresNonAJourTable = ({
  mode,
  territoiresSelectionnes,
  onSupprimerTerritoire,
  territoireCode,
}: {
  mode: NonAJourMode;
  territoiresSelectionnes: TerritoireNonAJour[];
  onSupprimerTerritoire: (territoireCode: string) => void;
  territoireCode: string;
}) => {
  const { isModeP } = useMesureWidget();

  const sortedTerritoires = useMemo(
    () => [...territoiresSelectionnes].sort(compareTerritoires),
    [territoiresSelectionnes],
  );

  const headers =
    mode === "chantier"
      ? ["Non à jour", "Sans donnée"]
      : ["Dernière valeur", "Mise à jour attendue depuis"];

  return (
    <div className="grid grid-cols-3 border-y text-xs">
      <div className="grid col-span-full grid-cols-subgrid border-b border-b-black">
        <div />
        {headers.map((header) => (
          <div
            key={header}
            className="text-center text-sm py-1 text-dsfr-mention-grey"
          >
            {header}
          </div>
        ))}
      </div>

      {sortedTerritoires.map((territoire) => {
        const isInitial = territoire.territoireCode === territoireCode;
        return (
          <Fragment key={territoire.territoireCode}>
            <div
              className={clsxm("border-b", { "flex justify-center": !isModeP })}
            >
              <div
                className={clsxm("py-2", {
                  "w-full max-w-[300px] mr-auto": !isModeP,
                })}
              >
                <TerritoireLabel
                  nom={getLabelTerritoire(territoire.territoireCode)}
                  couleur={getCouleurTerritoireParCode(
                    territoire.territoireCode,
                  )}
                  onSupprimer={
                    !isInitial
                      ? () => onSupprimerTerritoire(territoire.territoireCode)
                      : undefined
                  }
                />
              </div>
            </div>
            <Cells territoire={territoire} />
          </Fragment>
        );
      })}
    </div>
  );
};
