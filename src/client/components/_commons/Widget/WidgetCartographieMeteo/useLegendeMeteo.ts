import { useMemo } from "react";
import { ÉLÉMENTS_LÉGENDE_MÉTÉO_CHANTIERS } from "@/client/constants/légendes/élémentsDeLégendesCartographieMétéo";
import { MeteoTerritoireViewModel } from "@/server/chantiers/infrastructure/queries/GetChantierMeteosTerritoiresQuery";

export const useLegendeMeteo = (
  territoiresMeteo: MeteoTerritoireViewModel[],
) => {
  return useMemo(() => {
    const tousApplicables = territoiresMeteo.every(
      (territoire) => territoire.estApplicable,
    );
    const tousNonNull = territoiresMeteo.every(
      (territoire) => territoire.meteo !== "NON_RENSEIGNEE",
    );

    let legendeAffichee = Object.values(ÉLÉMENTS_LÉGENDE_MÉTÉO_CHANTIERS);

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
          el.libellé !== "Territoire pour lequel la météo n'est pas renseignée",
      );
    }

    return legendeAffichee.map(({ remplissage, libellé }) => ({
      libellé,
      remplissage,
    }));
  }, [territoiresMeteo]);
};
