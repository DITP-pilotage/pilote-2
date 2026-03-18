import { useMemo } from "react";
import { ÉLÉMENTS_LÉGENDE_AVANCEMENT_CHANTIERS } from "@/client/constants/légendes/élémentsDeLégendesCartographieAvancement";
import { AvancementTerritoireViewModel } from "@/server/chantiers/infrastructure/queries/GetChantierAvancementsTerritoiresQuery";

export const useLegendeTA = (territoires: AvancementTerritoireViewModel[]) => {
  return useMemo(() => {
    const tousApplicables = territoires.every(
      (territoire) => territoire.estApplicable,
    );
    const tousNonNull = territoires.every(
      (territoire) => territoire.avancementAnnuel !== null,
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
