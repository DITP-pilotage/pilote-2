import { useMemo } from "react";
import { ÉLÉMENTS_LÉGENDE_AVANCEMENT_CHANTIERS } from "@/client/constants/légendes/élémentsDeLégendesCartographieAvancement";
import { TauxAvancementComparaisonTerritoireViewModel } from "@/server/chantiers/app/contrats/TauxAvancementComparaisonTerritoireViewModel";

export const useLegendeTA = (
  territoires: TauxAvancementComparaisonTerritoireViewModel[],
) => {
  return useMemo(() => {
    const tousApplicables = territoires.every(
      (territoire) => territoire.estApplicable,
    );
    const tousNonNull = territoires.every(
      (territoire) => territoire.tauxAvancementJalon !== null,
    );

    let legendeAffichee = Object.values(ÉLÉMENTS_LÉGENDE_AVANCEMENT_CHANTIERS);

    if (tousApplicables) {
      legendeAffichee = legendeAffichee.filter(
        (el) =>
          el.libellé !==
          "Territoire où le chantier prioritaire ne s'applique pas",
      );
    }

    if (tousNonNull) {
      legendeAffichee = legendeAffichee.filter(
        (el) =>
          el.libellé !==
          "Territoire pour lequel la donnée n'est pas renseignée/disponible",
      );
    }

    return legendeAffichee.map(({ remplissage, libellé }) => ({
      libellé,
      remplissage,
    }));
  }, [territoires]);
};
