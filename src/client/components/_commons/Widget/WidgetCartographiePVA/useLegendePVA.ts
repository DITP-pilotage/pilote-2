import { useMemo } from "react";
import { ELEMENTS_LEGENDE_PROPOSITION_VALEUR_CHANTIERS } from "@/client/constants/légendes/elementDeLegendesCartographiePropositionValeur";
import { PVATerritoireViewModel } from "@/server/chantiers/infrastructure/queries/GetChantierPVACountTerritoiresQuery";

export const useLegendePVA = (territoires: PVATerritoireViewModel[]) => {
  return useMemo(() => {
    const tousApplicables = territoires.every(
      (territoire) => territoire.estApplicable,
    );

    const clesAExclure = new Set<string>();
    if (tousApplicables) clesAExclure.add("NON_APPLICABLE");

    return Object.entries(ELEMENTS_LEGENDE_PROPOSITION_VALEUR_CHANTIERS)
      .filter(([cle]) => !clesAExclure.has(cle))
      .map(([, { remplissage, libellé }]) => ({ libellé, remplissage }));
  }, [territoires]);
};
