import { Fragment, useMemo } from "react";
import { getCouleurTerritoireParCode } from "@/client/utils/couleur/paletteTerritoires";
import { PVATerritoireViewModel } from "@/server/chantiers/infrastructure/queries/GetChantierPVACountTerritoiresQuery";
import { useMesureWidget } from "@/components/_commons/Widget/TuileWidget/useMesureWidget";
import { TerritoireLabel } from "@/components/_commons/Widget/TerritoireLabel";
import { clsxm } from "@/utils/clsxm";
import { formaterPropositions } from "./formaterPropositions";

export const NombrePropositionsValeur = ({
  territoiresSelectionnes,
  onSupprimerTerritoire,
  jalon,
  territoireCode,
}: {
  territoiresSelectionnes: PVATerritoireViewModel[];
  onSupprimerTerritoire: (territoireCode: string) => void;
  jalon: number;
  territoireCode: string;
}) => {
  const { isModeP } = useMesureWidget();

  const territoiresTries = useMemo(
    () =>
      [...territoiresSelectionnes].sort(
        (territoire1, territoire2) =>
          territoire2.nombrePropositionsValeur -
          territoire1.nombrePropositionsValeur,
      ),
    [territoiresSelectionnes],
  );

  return (
    <div>
      <div className="grid grid-cols-2 border-y text-xs">
        <div className="grid col-span-2 grid-cols-subgrid border-b border-b-black">
          <div />
          <div className="text-center text-sm py-1 text-dsfr-mention-grey">
            {jalon}
          </div>
        </div>

        {territoiresTries.map((territoire) => {
          const estInitial = territoire.territoireCode === territoireCode;
          const couleur = getCouleurTerritoireParCode(
            territoire.territoireCode,
          );

          return (
            <Fragment key={territoire.territoireCode}>
              <div
                className={clsxm("border-b", {
                  "flex justify-center": !isModeP,
                })}
              >
                <div
                  className={clsxm("py-2", {
                    "w-full max-w-[300px] mr-auto": !isModeP,
                  })}
                >
                  <TerritoireLabel
                    nom={territoire.territoireNom}
                    couleur={couleur}
                    onSupprimer={
                      !estInitial
                        ? () => onSupprimerTerritoire(territoire.territoireCode)
                        : undefined
                    }
                  />
                </div>
              </div>
              <div
                className={clsxm(
                  "py-2 flex items-center justify-center border-b",
                )}
              >
                <span>
                  {formaterPropositions(
                    territoire.nombrePropositionsValeur,
                    territoire.estApplicable,
                  )}
                </span>
              </div>
            </Fragment>
          );
        })}
      </div>
    </div>
  );
};
