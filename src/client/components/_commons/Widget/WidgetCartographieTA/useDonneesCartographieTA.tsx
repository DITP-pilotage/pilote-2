import { useMemo } from "react";
import { ÉLÉMENTS_LÉGENDE_AVANCEMENT_CHANTIERS } from "@/client/constants/légendes/élémentsDeLégendesCartographieAvancement";
import { récupérerDétailsSurUnTerritoire } from "@/client/constants/territoires";
import { determinerRemplissageAvancement } from "@/client/utils/avancement/determinerRemplissageAvancement";
import { determinerValeurAfficheeAvancement } from "@/client/utils/avancement/determinerValeurAfficheeAvancement";
import { CartographieV2Donnee } from "@/components/_commons/CartographieV2/types";
import { TauxAvancementComparaisonTerritoireViewModel } from "@/server/chantiers/app/contrats/TauxAvancementComparaisonTerritoireViewModel";

export const useDonneesCartographieTA = (
  territoires: TauxAvancementComparaisonTerritoireViewModel[],
  jalon: number,
) => {
  return useMemo(() => {
    return territoires.reduce(
      (acc, territoire) => {
        return {
          ...acc,
          [territoire.territoireCode]: {
            remplissage: determinerRemplissageAvancement(
              territoire.tauxAvancementJalon,
              ÉLÉMENTS_LÉGENDE_AVANCEMENT_CHANTIERS,
              territoire.estApplicable,
            ),
            libelle:
              récupérerDétailsSurUnTerritoire(territoire.territoireCode)
                ?.nomAffiché ?? territoire.territoireCode,
            contenuInfoBulle: determinerValeurAfficheeAvancement(
              territoire.tauxAvancementJalon,
              territoire.estApplicable,
              jalon,
            ),
          },
        };
      },
      {} as Record<string, CartographieV2Donnee>,
    );
  }, [territoires, jalon]);
};
