import { ReactNode, useMemo } from "react";
import { ELEMENTS_LEGENDE_PROPOSITION_VALEUR_CHANTIERS } from "@/client/constants/légendes/elementDeLegendesCartographiePropositionValeur";
import { CartographieV2Donnee } from "@/components/_commons/CartographieV2/types";
import { PVATerritoireViewModel } from "@/server/chantiers/infrastructure/queries/GetChantierPVATerritoiresQuery";

const determinerRemplissage = (
  nombrePropositions: number,
  estApplicable: boolean | null,
) => {
  if (!estApplicable) {
    return ELEMENTS_LEGENDE_PROPOSITION_VALEUR_CHANTIERS.NON_APPLICABLE
      .remplissage;
  }
  return nombrePropositions > 0
    ? ELEMENTS_LEGENDE_PROPOSITION_VALEUR_CHANTIERS.PROPOSITION.remplissage
    : ELEMENTS_LEGENDE_PROPOSITION_VALEUR_CHANTIERS.DEFAUT.remplissage;
};

const determinerContenuInfoBulle = (
  nombrePropositions: number,
  estApplicable: boolean | null,
): ReactNode => {
  if (estApplicable === false) {
    return <div className="fr-text--bold">Non applicable</div>;
  }
  if (nombrePropositions === 0) {
    return <div className="fr-text--bold">pas de proposition</div>;
  }
  return (
    <div className="fr-text--bold">
      {`${nombrePropositions} ${nombrePropositions > 1 ? "propositions" : "proposition"}`}
    </div>
  );
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
          contenuInfoBulle: determinerContenuInfoBulle(
            territoire.nombrePropositionsValeur,
            territoire.estApplicable,
          ),
        },
      }),
      {} as Record<string, CartographieV2Donnee>,
    );
  }, [territoires]);
};
