import { scenarioEval } from "../scenarioEval";
import { ENCART_CRITERIA } from "../criteria/encart";
import { SYNTHESE_DEPARTEMENTS_CRITERIA } from "./syntheseDepartements.criteria";

/**
 * Scénario « Synthèse de Bretagne et ses départements » (DITP, envoyé,
 * territoire courant régional).
 *
 * Avec cinq territoires dans les résultats, le prompt impose le gabarit
 * COMPARAISON : la grille le suit. Que ce soit le bon rendu pour une
 * « synthèse de X et ses départements » est une question pour le produit.
 *
 * Référence observée le 2026-09-30 : outils 100 %, forme 93 %, fond 100 %.
 * Gabarit comparaison suivi ; codes météo bruts et commentaire recopié
 * dans un essai sur trois.
 * Second run du 2026-09-30 : outils 100 %, forme 89 %, fond 100 % ; recopie
 * 0/3.
 * Run du 2026-10-14, juge mistral-medium-3-5 : outils 100 %, forme 80 %, fond
 * 87 % ; échecs : Pas de recopie 0/3, Chiffres exacts 2/3, Résumés fidèles 2/3.
 */

const bretagneEtSesDepartements = {
  perimetre: { type: "REGION_ET_SES_DEPARTEMENTS", region_code: "REG-53" },
};

scenarioEval({
  suite: "Synthèse de Bretagne et ses départements",
  group: "synthese",
  criteria: [...SYNTHESE_DEPARTEMENTS_CRITERIA, ...ENCART_CRITERIA],
  matter: "encart",
  cases: [
    {
      question: "Fais moi la synthèse de Bretagne et ses départements",
      reason: "Message envoyé tel quel",
      truthScope: {
        territoires: ["REG-53"],
        perimetre: {
          type: "REGION_ET_SES_DEPARTEMENTS",
          region_code: "REG-53",
        },
      },
      expected: [
        {
          toolName: "rediger_comparaison_territoires",
          input: bretagneEtSesDepartements,
        },
      ],
      tableTerritories: ["REG-53", "DEPT-22", "DEPT-29", "DEPT-35", "DEPT-56"],
    },
  ],
});
