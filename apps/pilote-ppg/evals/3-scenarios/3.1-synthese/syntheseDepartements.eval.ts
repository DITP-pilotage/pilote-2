import { GRIDS } from "../grids";
import { scenarioEval } from "../scenarioEval";

/**
 * Scénario « Synthèse de Bretagne et ses départements » (DITP, envoyé,
 * territoire courant régional).
 *
 * Avec cinq territoires dans les résultats, le prompt impose le gabarit
 * COMPARAISON : la grille le suit. Que ce soit le bon rendu pour une
 * « synthèse de X et ses départements » est une question pour le produit.
 *
 * Référence observée : à compléter au premier run.
 */

const avecSousTerritoires = {
  territoire_code: "REG-53",
  include_sous_territoires: true,
};

scenarioEval({
  suite: "Synthèse de Bretagne et ses départements",
  group: "synthese",
  grid: GRIDS.syntheseSousTerritoires,
  cases: [
    {
      question: "Fais moi la synthèse de Bretagne et ses départements",
      reason: "Message envoyé tel quel",
      truthScope: { territoires: ["REG-53"], includeSousTerritoires: true },
      expected: [
        {
          toolName: "get_taux_avancement_territoire",
          input: avecSousTerritoires,
        },
        {
          toolName: "get_chantiers",
          input: { ...avecSousTerritoires, view: "en_retard" },
        },
        {
          toolName: "get_chantiers",
          input: { ...avecSousTerritoires, view: "en_difficulte" },
        },
      ],
      tableTerritories: ["REG-53", "DEPT-22", "DEPT-29", "DEPT-35", "DEPT-56"],
    },
  ],
});
