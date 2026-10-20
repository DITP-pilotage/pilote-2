import { Fragment, useMemo } from "react";
import { getCouleurTerritoireParCode } from "@/client/utils/couleur/paletteTerritoires";
import { getLabelTerritoire } from "@/client/constants/territoires";
import { useMesureWidget } from "@/components/_commons/Widget/TuileWidget/useMesureWidget";
import { TerritoireLabel } from "@/components/_commons/Widget/TerritoireLabel";
import { clsxm } from "@/utils/clsxm";
import {
  formatDateDerniereValeur,
  formatMiseAJourAttendueDepuis,
  formatNbIndicateursNonAJour,
  isChantierMode,
  isTerritoireNonAJour,
  NonAJourMode,
  TerritoireNonAJour,
} from "./nonAJourDisplay";

const getNbIndicateursNonAJour = (territoire: TerritoireNonAJour) =>
  isChantierMode(territoire) ? territoire.nbIndicateursNonAJour : 0;

const Cells = ({ territoire }: { territoire: TerritoireNonAJour }) => {
  if (isChantierMode(territoire)) {
    return (
      <div className="py-2 flex items-center justify-center border-b">
        {formatNbIndicateursNonAJour(territoire)}
      </div>
    );
  }
  if (!territoire.estApplicable) {
    return (
      <div className="col-span-2 py-2 flex items-center justify-center border-b">
        Non applicable
      </div>
    );
  }
  return (
    <>
      <div className="py-2 flex items-center justify-center border-b">
        {formatDateDerniereValeur(territoire)}
      </div>
      <div
        className={clsxm("py-2 flex items-center justify-center border-b", {
          "text-dsfr-warning-425 font-bold": !territoire.estAJour,
        })}
      >
        {territoire.estAJour
          ? "À jour"
          : formatMiseAJourAttendueDepuis(territoire)}
      </div>
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
    () =>
      [...territoiresSelectionnes].sort(
        (left, right) =>
          Number(isTerritoireNonAJour(right)) -
            Number(isTerritoireNonAJour(left)) ||
          getNbIndicateursNonAJour(right) - getNbIndicateursNonAJour(left),
      ),
    [territoiresSelectionnes],
  );

  const headers =
    mode === "chantier"
      ? ["Indicateurs non à jour"]
      : ["Dernière valeur", "Mise à jour attendue depuis"];

  return (
    <div
      className={clsxm("grid border-y text-xs", {
        "grid-cols-2": mode === "chantier",
        "grid-cols-3": mode === "indicateur",
      })}
    >
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
