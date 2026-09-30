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
 * Référence observée le 2026-09-30 : outils 100 %, forme 93 %, fond 100 %.
 * Gabarit comparaison suivi ; codes météo bruts et commentaire recopié
 * dans un essai sur trois.
 * Second run du 2026-09-30 : outils 100 %, forme 89 %, fond 100 % ; recopie
 * 0/3.
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
