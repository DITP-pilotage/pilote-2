import { useMemo } from "react";
import {
  ELEMENTS_LEGENDE_PROPOSITION_VALEUR_CHANTIERS,
  ELEMENTS_LEGENDE_PROPOSITION_VALEUR_INDICATEURS,
} from "@/client/constants/légendes/elementDeLegendesCartographiePropositionValeur";
import { PVATerritoireViewModel } from "@/server/chantiers/infrastructure/queries/GetChantierPVACountTerritoiresQuery";

export const useLegendePVA = (
  territoires: PVATerritoireViewModel[],
  mode: "chantier" | "indicateur",
) => {
  return useMemo(() => {
    const legende =
      mode === "indicateur"
        ? ELEMENTS_LEGENDE_PROPOSITION_VALEUR_INDICATEURS
        : ELEMENTS_LEGENDE_PROPOSITION_VALEUR_CHANTIERS;

    const tousApplicables = territoires.every(
      (territoire) => territoire.estApplicable,
    );

    const clesAExclure = new Set<string>();
    if (tousApplicables) clesAExclure.add("NON_APPLICABLE");

    return Object.entries(legende)
      .filter(([cle]) => !clesAExclure.has(cle))
      .map(([, { remplissage, libellé }]) => ({ libellé, remplissage }));
  }, [territoires, mode]);
};
