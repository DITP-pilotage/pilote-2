import { useMemo } from "react";
import {
  ELEMENTS_LEGENDE_PROPOSITION_VALEUR_CHANTIERS,
  ELEMENTS_LEGENDE_PROPOSITION_VALEUR_INDICATEURS,
} from "@/client/constants/légendes/elementDeLegendesCartographiePropositionValeur";
import { getLabelTerritoire } from "@/client/constants/territoires";
import { CartographieV2Donnee } from "@/components/_commons/CartographieV2/types";
import { PVATerritoireViewModel } from "@/server/chantiers/infrastructure/queries/GetChantierPVACountTerritoiresQuery";
import { formaterPropositions } from "./formaterPropositions";

const determinerRemplissage = (
  nombrePropositions: number,
  estApplicable: boolean | null,
  mode: "chantier" | "indicateur",
) => {
  const legende =
    mode === "indicateur"
      ? ELEMENTS_LEGENDE_PROPOSITION_VALEUR_INDICATEURS
      : ELEMENTS_LEGENDE_PROPOSITION_VALEUR_CHANTIERS;

  if (estApplicable === false) {
    return legende.NON_APPLICABLE.remplissage;
  }
  return nombrePropositions > 0
    ? legende.PROPOSITION.remplissage
    : legende.DEFAUT.remplissage;
};

export const useDonneesCartographiePVA = (
  territoires: PVATerritoireViewModel[],
  mode: "chantier" | "indicateur",
) => {
  return useMemo(() => {
    return territoires.reduce(
      (acc, territoire) => ({
        ...acc,
        [territoire.territoireCode]: {
          remplissage: determinerRemplissage(
            territoire.nombrePropositionsValeur,
            territoire.estApplicable,
            mode,
          ),
          libelle: getLabelTerritoire(territoire.territoireCode),
          contenuInfoBulle: (
            <div className="fr-text--bold">
              {formaterPropositions(
                territoire.nombrePropositionsValeur,
                territoire.estApplicable,
              )}
            </div>
          ),
        },
      }),
      {} as Record<string, CartographieV2Donnee>,
    );
  }, [territoires, mode]);
};
