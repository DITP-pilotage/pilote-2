import { Fragment, useMemo } from "react";
import { getCouleurTerritoireParCode } from "@/client/utils/couleur/paletteTerritoires";
import { PVATerritoireViewModel } from "@/server/chantiers/infrastructure/queries/GetChantierPVATerritoiresQuery";
import { useMesureWidget } from "@/components/_commons/Widget/TuileWidget/useMesureWidget";
import { clsxm } from "@/utils/clsxm";

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
  const { isModeDispositionG } = useMesureWidget();

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
                  "flex justify-center": isModeDispositionG(),
                })}
              >
                <div
                  className={clsxm(
                    "py-2 grid grid-cols-[1fr_30px] items-center gap-2",
                    {
                      "w-full max-w-[300px] mr-auto": isModeDispositionG(),
                    },
                  )}
                >
                  <span className="text-right" style={{ color: couleur }}>
                    {territoire.territoireNom}
                  </span>
                  {!estInitial && (
                    <button
                      onClick={() =>
                        onSupprimerTerritoire(territoire.territoireCode)
                      }
                      title={`Retirer ${territoire.territoireNom}`}
                      type="button"
                      className="p-2"
                      style={{ color: couleur }}
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
              <div
                className={clsxm(
                  "py-2 flex items-center justify-center border-b",
                )}
              >
                {territoire.estApplicable === false ? (
                  <span>Non applicable</span>
                ) : territoire.nombrePropositionsValeur === 0 ? (
                  <span>pas de proposition</span>
                ) : (
                  <span>
                    {`${territoire.nombrePropositionsValeur} ${territoire.nombrePropositionsValeur > 1 ? "propositions" : "proposition"}`}
                  </span>
                )}
              </div>
            </Fragment>
          );
        })}
      </div>
    </div>
  );
};
