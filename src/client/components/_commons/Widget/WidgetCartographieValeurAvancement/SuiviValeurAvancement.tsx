import { useMemo } from "react";
import { getCouleurTerritoireParCode } from "@/client/utils/couleur/paletteTerritoires";
import { récupérerDétailsSurUnTerritoire } from "@/client/constants/territoires";
import { ValeurAvancementIndicateurTerritoire } from "./types";

const formatValeur = (
  valeur: number | null,
  unite: string | null,
): string => {
  if (valeur === null) return "Non renseigné";
  const unitéAffichée =
    unite?.toLocaleLowerCase() === "pourcentage" ? "%" : "";
  return valeur.toLocaleString() + unitéAffichée;
};

export const SuiviValeurAvancement = ({
  territoiresSelectionnes,
  onSupprimerTerritoire,
  territoireCode,
  jalon,
  unite,
}: {
  territoiresSelectionnes: ValeurAvancementIndicateurTerritoire[];
  onSupprimerTerritoire: (territoireCode: string) => void;
  territoireCode: string;
  jalon: number;
  unite: string | null;
}) => {
  const territoiresTries = useMemo(
    () =>
      [...territoiresSelectionnes].sort((territoire1, territoire2) => {
        if (
          territoire1.valeurAvancement === null &&
          territoire2.valeurAvancement === null
        )
          return 0;
        if (territoire1.valeurAvancement === null) return 1;
        if (territoire2.valeurAvancement === null) return -1;
        return territoire2.valeurAvancement - territoire1.valeurAvancement;
      }),
    [territoiresSelectionnes],
  );

  return (
    <div className="text-xs flex flex-col">
      {territoiresTries.map((territoire) => {
        const estInitial = territoire.territoireCode === territoireCode;
        const couleur = getCouleurTerritoireParCode(
          territoire.territoireCode,
        );
        const détails = récupérerDétailsSurUnTerritoire(
          territoire.territoireCode,
        );
        const nom = détails?.nomAffiché ?? territoire.territoireCode;

        return (
          <div
            key={territoire.territoireCode}
            className="grid grid-cols-[120px_1fr_1fr] items-center py-2"
          >
            <div className="flex items-center gap-1">
              <span
                className="text-right flex-1 truncate"
                style={{ color: couleur }}
              >
                {nom}
              </span>
              {!estInitial ? (
                <button
                  onClick={() =>
                    onSupprimerTerritoire(territoire.territoireCode)
                  }
                  title={`Retirer ${nom}`}
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
            ) : (
              <>
                <div className="whitespace-nowrap text-center">
                  <span className="!text-dsfr-grey-625">VA : </span>
                  <span style={{ color: couleur }}>
                    {formatValeur(territoire.valeurAvancement, unite)}
                  </span>
                </div>
                <div className="whitespace-nowrap text-center">
                  <span className="!text-dsfr-grey-625">
                    VC {jalon} :{" "}
                  </span>
                  <span style={{ color: couleur }}>
                    {formatValeur(territoire.valeurCibleAnnuelle, unite)}
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
