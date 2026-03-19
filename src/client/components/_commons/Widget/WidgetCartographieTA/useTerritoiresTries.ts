import { useMemo } from "react";
import { TauxAvancementComparaisonTerritoireViewModel } from "@/server/chantiers/app/contrats/TauxAvancementComparaisonTerritoireViewModel";

export const useTerritoiresTries = (
  territoiresSelectionnes: TauxAvancementComparaisonTerritoireViewModel[],
) =>
  useMemo(
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
