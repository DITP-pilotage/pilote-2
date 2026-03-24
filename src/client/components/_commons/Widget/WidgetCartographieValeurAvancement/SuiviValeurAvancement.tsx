import { useMemo } from "react";
import { getCouleurTerritoireParCode } from "@/client/utils/couleur/paletteTerritoires";
import { récupérerDétailsSurUnTerritoire } from "@/client/constants/territoires";
import { TerritoireLabel } from "@/components/_commons/Widget/TerritoireLabel";
import { TerritoireProgressBar } from "@/components/_commons/Widget/TerritoireProgressBar";
import { ValeurAvancementIndicateurTerritoire } from "./types";

const formatValeur = (valeur: number | null, unite: string | null): string => {
  if (valeur === null) return "Non renseigné";
  const unitéAffichée = unite?.toLocaleLowerCase() === "pourcentage" ? "%" : "";
  return valeur.toLocaleString() + unitéAffichée;
};

const computePourcentage = (
  valeur: number | null,
  min: number | null,
  max: number | null,
): number => {
  if (valeur === null || min === null || max === null) return 0;
  if (max === min) return 100;
  return ((valeur - min) / (max - min)) * 100;
};

export const SuiviValeurAvancement = ({
  territoiresSelectionnes,
  onSupprimerTerritoire,
  territoireCode,
  unite,
  statistiques,
}: {
  territoiresSelectionnes: ValeurAvancementIndicateurTerritoire[];
  onSupprimerTerritoire: (territoireCode: string) => void;
  territoireCode: string;
  unite: string | null;
  statistiques: {
    minimum: number | null;
    maximum: number | null;
  };
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
        const couleur = getCouleurTerritoireParCode(territoire.territoireCode);
        const détails = récupérerDétailsSurUnTerritoire(
          territoire.territoireCode,
        );
        const nom = détails?.nomAffiché ?? territoire.territoireCode;

        return (
          <div
            key={territoire.territoireCode}
            className="grid grid-cols-[120px_1fr_auto] items-center py-2"
          >
            <TerritoireLabel
              nom={nom}
              couleur={couleur}
              onSupprimer={
                !estInitial
                  ? () => onSupprimerTerritoire(territoire.territoireCode)
                  : undefined
              }
            />

            {territoire.estApplicable === false ? (
              <span className="col-span-2 text-center">Non applicable</span>
            ) : territoire.valeurAvancement === null ? (
              <span className="col-span-2 text-center">Non renseigné</span>
            ) : (
              <TerritoireProgressBar
                pourcentage={computePourcentage(
                  territoire.valeurAvancement,
                  statistiques.minimum,
                  statistiques.maximum,
                )}
                libelle={formatValeur(territoire.valeurAvancement, unite)}
                couleur={couleur}
              />
            )}
          </div>
        );
      })}
    </div>
  );
};
