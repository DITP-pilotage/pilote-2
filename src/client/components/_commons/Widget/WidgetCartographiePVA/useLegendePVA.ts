import { useMemo } from "react";
import { ELEMENTS_LEGENDE_PROPOSITION_VALEUR_CHANTIERS } from "@/client/constants/légendes/elementDeLegendesCartographiePropositionValeur";
import { PVATerritoireViewModel } from "@/server/chantiers/infrastructure/queries/GetChantierPVATerritoiresQuery";

export const useLegendePVA = (territoires: PVATerritoireViewModel[]) => {
  return useMemo(() => {
    const tousApplicables = territoires.every(
      (territoire) => territoire.estApplicable,
    );

    let legendeAffichee = Object.values(
      ELEMENTS_LEGENDE_PROPOSITION_VALEUR_CHANTIERS,
    );

    if (tousApplicables) {
      legendeAffichee = legendeAffichee.filter(
        (el) =>
          el.libellé !==
          "Territoire où le chantier prioritaire ne s'applique pas",
      );
    }

    return legendeAffichee.map(({ remplissage, libellé }) => ({
      libellé,
      remplissage,
    }));
  }, [territoires]);
};
