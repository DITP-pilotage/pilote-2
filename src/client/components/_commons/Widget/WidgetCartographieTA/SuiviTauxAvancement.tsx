import { Fragment, useMemo } from "react";
import { getCouleurTerritoire } from "@/client/utils/couleur/paletteTerritoires";
import { AvancementTerritoireViewModel } from "@/server/chantiers/infrastructure/queries/GetChantierAvancementsTerritoiresQuery";
import { useMesureWidget } from "@/components/_commons/Widget/TuileWidget/useMesureWidget";
import { clsxm } from "@/utils/clsxm";

export const SuiviTauxAvancement = ({
  territoiresSelectionnes,
  onSupprimerTerritoire,
  territoireCode,
}: {
  territoiresSelectionnes: AvancementTerritoireViewModel[];
  onSupprimerTerritoire: (territoireCode: string) => void;
  territoireCode: string;
}) => {
  const { isModeDispositionG } = useMesureWidget();

  const territoiresTries = useMemo(
    () =>
      [...territoiresSelectionnes].sort((a, b) => {
        if (a.avancementAnnuel === null && b.avancementAnnuel === null)
          return 0;
        if (a.avancementAnnuel === null) return 1;
        if (b.avancementAnnuel === null) return -1;
        return b.avancementAnnuel - a.avancementAnnuel;
      }),
    [territoiresSelectionnes],
  );

  return (
    <div>
      <div className="grid grid-cols-2 text-xs">
        {territoiresTries.map((territoire, index) => {
          const dateMaj = territoire.dateTauxAvancementAnnuel
            ? new Date(territoire.dateTauxAvancementAnnuel).toLocaleDateString(
                "fr-FR",
              )
            : "—";
          const estInitial = territoire.territoireCode === territoireCode;
          const couleur = getCouleurTerritoire(index);

          return (
            <Fragment key={territoire.territoireCode}>
              <div
                className={clsxm({
                  "flex justify-center": isModeDispositionG(),
                })}
              >
                <div
                  className={clsxm(
                    "py-1 grid grid-cols-[1fr_30px] items-center gap-2",
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
                className={clsxm("py-1 flex items-center flex-col", {
                  "flex-row gap-4": isModeDispositionG(),
                })}
              >
                {territoire.estApplicable === false ? (
                  <span>Non applicable</span>
                ) : territoire.avancementAnnuel === null ? (
                  <span>Non renseigné</span>
                ) : (
                  <div className="flex items-center gap-2 w-full px-2">
                    <div className="flex-1 h-3 rounded-full bg-dsfr-grey-925">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${Math.min(territoire.avancementAnnuel, 100)}%`,
                          backgroundColor: couleur,
                        }}
                      />
                    </div>

                    <div
                      className={clsxm("flex whitespace-nowrap", {
                        "flex-col": !isModeDispositionG(),
                        "items-baseline flex-row gap-1": isModeDispositionG(),
                      })}
                    >
                      <span style={{ color: couleur }}>
                        {territoire.avancementAnnuel.toFixed(0)} %
                      </span>
                      <span className="text-[10px] !text-dsfr-grey-625">
                        ({dateMaj})
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </Fragment>
          );
        })}
      </div>
    </div>
  );
};
