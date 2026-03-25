import { useMemo } from "react";
import { ELEMENTS_LEGENDE_PROPOSITION_VALEUR_CHANTIERS } from "@/client/constants/légendes/elementDeLegendesCartographiePropositionValeur";
import { CartographieV2Donnee } from "@/components/_commons/CartographieV2/types";
import { PVATerritoireViewModel } from "@/server/chantiers/infrastructure/queries/GetChantierPVACountTerritoiresQuery";
import { formaterPropositions } from "./formaterPropositions";

const determinerRemplissage = (
  nombrePropositions: number,
  estApplicable: boolean | null,
) => {
  if (estApplicable === false) {
    return ELEMENTS_LEGENDE_PROPOSITION_VALEUR_CHANTIERS.NON_APPLICABLE
      .remplissage;
  }
  return nombrePropositions > 0
    ? ELEMENTS_LEGENDE_PROPOSITION_VALEUR_CHANTIERS.PROPOSITION.remplissage
    : ELEMENTS_LEGENDE_PROPOSITION_VALEUR_CHANTIERS.DEFAUT.remplissage;
};

export const useDonneesCartographiePVA = (
  territoires: PVATerritoireViewModel[],
) => {
  return useMemo(() => {
    return territoires.reduce(
      (acc, territoire) => ({
        ...acc,
        [territoire.territoireCode]: {
          remplissage: determinerRemplissage(
            territoire.nombrePropositionsValeur,
            territoire.estApplicable,
          ),
          libelle: territoire.territoireNom,
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
  }, [territoires]);
};
