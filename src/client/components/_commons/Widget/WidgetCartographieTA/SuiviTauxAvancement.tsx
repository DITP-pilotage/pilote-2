import { useMemo } from "react";
import { TauxAvancementComparaisonTerritoireViewModel } from "@/server/chantiers/app/contrats/TauxAvancementComparaisonTerritoireViewModel";
import {
  SuiviTerritoires,
  SuiviTerritoireItem,
} from "@/components/_commons/Widget/SuiviTerritoires";

export const SuiviTauxAvancement = ({
  territoiresSelectionnes,
  onSupprimerTerritoire,
  territoireCode,
}: {
  territoiresSelectionnes: TauxAvancementComparaisonTerritoireViewModel[];
  onSupprimerTerritoire: (territoireCode: string) => void;
  territoireCode: string;
}) => {
  const territoires: SuiviTerritoireItem[] = useMemo(
    () =>
      [...territoiresSelectionnes]
        .sort((a, b) => {
          if (a.tauxAvancementJalon === null && b.tauxAvancementJalon === null)
            return 0;
          if (a.tauxAvancementJalon === null) return 1;
          if (b.tauxAvancementJalon === null) return -1;
          return b.tauxAvancementJalon - a.tauxAvancementJalon;
        })
        .map((territoire) => ({
          territoireCode: territoire.territoireCode,
          nom: territoire.territoireNom,
          estApplicable: territoire.estApplicable,
          pourcentage: territoire.tauxAvancementJalon,
          libelle:
            territoire.tauxAvancementJalon !== null
              ? `${territoire.tauxAvancementJalon.toFixed(0)} %`
              : "",
          dateMaj: territoire.dateTauxAvancementAnnuel ?? null,
        })),
    [territoiresSelectionnes],
  );

  return (
    <SuiviTerritoires
      territoires={territoires}
      territoireCode={territoireCode}
      onSupprimerTerritoire={onSupprimerTerritoire}
    />
  );
};
