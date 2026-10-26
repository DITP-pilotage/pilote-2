import { scenarioEval } from "../scenarioEval";
import { SYNTHESE_DEPARTEMENTS_CRITERIA } from "./syntheseDepartements.criteria";

/**
 * Scénario « Synthèse de Bretagne et ses départements » (DITP, envoyé,
 * territoire courant régional).
 *
 * Avec cinq territoires dans les résultats, `synthese_territoire` renvoie le
 * gabarit COMPARAISON : la grille le suit. Que ce soit le bon rendu pour une
 * « synthèse de X et ses départements » est une question pour le produit.
 *
 * Référence observée le 2026-09-30 : outils 100 %, forme 93 %, fond 100 %.
 * Gabarit comparaison suivi ; codes météo bruts et commentaire recopié
 * dans un essai sur trois.
 * Second run du 2026-09-30 : outils 100 %, forme 89 %, fond 100 % ; recopie
 * 0/3.
 * Run du 2026-10-14, juge mistral-medium-3-5 : outils 100 %, forme 80 %, fond
 * 87 % ; échecs : Pas de recopie 0/3, Chiffres exacts 2/3, Résumés fidèles 2/3.
 * Run du 2026-10-26, après le passage à `synthese_territoire` : score 75 % ;
 * outils 3/3 ; échecs : Pas de recopie 0/3, Absence de commentaire signalée
 * 1/3, Analyse des écarts 1/3, Chiffres exacts 2/3, Pas d'opinion 2/3.
 */

const avecSousTerritoires = {
  territoire_code: "REG-53",
  include_sous_territoires: true,
};

scenarioEval({
  suite: "Synthèse de Bretagne et ses départements",
  group: "synthese",
  criteria: SYNTHESE_DEPARTEMENTS_CRITERIA,
  cases: [
    {
      question: "Fais moi la synthèse de Bretagne et ses départements",
      reason: "Message envoyé tel quel",
      truthScope: { territoires: ["REG-53"], includeSousTerritoires: true },
      expected: [
        { toolName: "synthese_territoire", input: avecSousTerritoires },
      ],
      forbidden: ["get_chantiers", "get_taux_avancement_territoire"],
      tableTerritories: ["REG-53", "DEPT-22", "DEPT-29", "DEPT-35", "DEPT-56"],
    },
  ],
});
