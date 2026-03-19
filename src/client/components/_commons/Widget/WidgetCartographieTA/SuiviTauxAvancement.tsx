import { useMemo } from "react";
import { getCouleurTerritoireParCode } from "@/client/utils/couleur/paletteTerritoires";
import { TauxAvancementComparaisonTerritoireViewModel } from "@/server/chantiers/app/contrats/TauxAvancementComparaisonTerritoireViewModel";

export const SuiviTauxAvancement = ({
  territoiresSelectionnes,
  onSupprimerTerritoire,
  territoireCode,
}: {
  territoiresSelectionnes: TauxAvancementComparaisonTerritoireViewModel[];
  onSupprimerTerritoire: (territoireCode: string) => void;
  territoireCode: string;
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
    <div className="text-xs flex flex-col">
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
            className="grid grid-cols-[120px_1fr_auto] items-center py-2"
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
              <span className="col-span-2 text-center">Non applicable</span>
            ) : territoire.tauxAvancementJalon === null ? (
              <span className="col-span-2 text-center">Non renseigné</span>
            ) : (
              <>
                <div className="h-4 rounded-full bg-dsfr-grey-925 mx-2">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${Math.min(territoire.tauxAvancementJalon, 100)}%`,
                      backgroundColor: couleur,
                    }}
                  />
                </div>

                <div className="whitespace-nowrap">
                  <span style={{ color: couleur }}>
                    {territoire.tauxAvancementJalon.toFixed(0)} %
                  </span>
                  <span className="text-[10px] !text-dsfr-grey-625">
                    {" "}
                    ({dateMaj})
                  </span>
                </div>
              </>
            )}
          </div>
        );
      })}
    </div>
  );
};
