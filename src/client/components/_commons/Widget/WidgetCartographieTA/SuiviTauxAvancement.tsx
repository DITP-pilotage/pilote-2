import { useMemo } from "react";
import { getCouleurTerritoireParCode } from "@/client/utils/couleur/paletteTerritoires";
import { TauxAvancementComparaisonTerritoireViewModel } from "@/server/chantiers/app/contrats/TauxAvancementComparaisonTerritoireViewModel";
import { TerritoireLabel } from "@/components/_commons/Widget/TerritoireLabel";
import { TerritoireProgressBar } from "@/components/_commons/Widget/TerritoireProgressBar";

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
          : null;
        const estInitial = territoire.territoireCode === territoireCode;
        const couleur = getCouleurTerritoireParCode(territoire.territoireCode);

        return (
          <div
            key={territoire.territoireCode}
            className="grid grid-cols-[120px_1fr_auto] items-center py-2"
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

            {territoire.estApplicable === false ? (
              <span className="col-span-2 text-center">Non applicable</span>
            ) : territoire.tauxAvancementJalon === null ? (
              <span className="col-span-2 text-center">Non renseigné</span>
            ) : (
              <TerritoireProgressBar
                pourcentage={territoire.tauxAvancementJalon}
                libelle={`${territoire.tauxAvancementJalon.toFixed(0)} %`}
                couleur={couleur}
                dateMaj={dateMaj}
              />
            )}
          </div>
        );
      })}
    </div>
  );
};
