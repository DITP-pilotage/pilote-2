import { useMemo } from "react";
import { getCouleurTerritoireParCode } from "@/client/utils/couleur/paletteTerritoires";
import { TauxAvancementComparaisonTerritoireViewModel } from "@/server/chantiers/app/contrats/TauxAvancementComparaisonTerritoireViewModel";

export const TableauTauxAvancement = ({
  territoiresSelectionnes,
  onSupprimerTerritoire,
  territoireCode,
  jalon,
}: {
  territoiresSelectionnes: TauxAvancementComparaisonTerritoireViewModel[];
  onSupprimerTerritoire: (territoireCode: string) => void;
  territoireCode: string;
  jalon: number;
}) => {
  const territoiresTries = useMemo(
    () =>
      [...territoiresSelectionnes].sort((territoire1, territoire2) => {
        if (
          territoire1.tauxAvancementJalon === null &&
          territoire2.tauxAvancementJalon === null
        )
          return 0;
        if (territoire1.tauxAvancementJalon === null) return 1;
        if (territoire2.tauxAvancementJalon === null) return -1;
        return (
          territoire2.tauxAvancementJalon - territoire1.tauxAvancementJalon
        );
      }),
    [territoiresSelectionnes],
  );

  return (
    <div className="text-xs">
      <div className="grid grid-cols-[120px_1fr] border-b pb-1 mb-1">
        <div />
        <div className="text-center font-bold">{jalon}</div>
      </div>
      {territoiresTries.map((territoire) => {
        const dateMaj = territoire.dateTauxAvancementAnnuel
          ? new Date(territoire.dateTauxAvancementAnnuel).toLocaleDateString(
              "fr-FR",
            )
          : "—";
        const estInitial = territoire.territoireCode === territoireCode;
        const couleur = getCouleurTerritoireParCode(territoire.territoireCode);

        return (
          <div
            key={territoire.territoireCode}
            className="grid grid-cols-[120px_1fr] items-center py-2 border-b"
          >
            <div className="flex items-center gap-1">
              <span
                className="text-right flex-1 truncate"
                style={{ color: couleur }}
              >
                {territoire.territoireNom}
              </span>
              {!estInitial ? (
                <button
                  onClick={() =>
                    onSupprimerTerritoire(territoire.territoireCode)
                  }
                  title={`Retirer ${territoire.territoireNom}`}
                  type="button"
                  className="p-2 -m-2"
                  style={{ color: couleur }}
                >
                  ✕
                </button>
              ) : (
                <div />
              )}
            </div>

            {territoire.estApplicable === false ? (
              <span className="text-center">Non applicable</span>
            ) : territoire.tauxAvancementJalon === null ? (
              <span className="text-center">Non renseigné</span>
            ) : (
              <div className="text-center">
                <span style={{ color: couleur }}>
                  {territoire.tauxAvancementJalon.toFixed(0)} %
                </span>
                <span className="text-[10px] !text-dsfr-grey-625">
                  {" "}
                  ({dateMaj})
                </span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
