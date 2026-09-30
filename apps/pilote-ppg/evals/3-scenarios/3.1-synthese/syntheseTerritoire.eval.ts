import { GRIDS } from "../grids";
import { scenarioEval } from "../scenarioEval";

/**
 * Scénario « Synthèse d'un territoire » (DITP, à compléter) :
 * « Fais moi la synthèse du territoire ». Le trou est complété par le
 * territoire courant, un département par son nom, un département par son
 * numéro.
 *
 * Le gabarit écrit « le TA de la région » quel que soit le territoire : le
 * critère « Maille nommée » le mesure sur les deux départements.
 *
 * Référence observée le 2026-09-30 : outils 93 %, forme 87 %, fond 94 %.
 * Le commentaire de synthèse de CH-005 est recopié (0/3 sur la Bretagne et
 * le 35). Sur le Finistère, un essai sur trois conclut « aucun chantier en
 * retard » sans avoir interrogé les vues, et un autre écrit « le TA de la
 * région » pour un département.
 */

const workflowSynthese = (territoire_code: string) => [
  { toolName: "get_taux_avancement_territoire", input: { territoire_code } },
  { toolName: "get_chantiers", input: { territoire_code, view: "en_retard" } },
  {
    toolName: "get_chantiers",
    input: { territoire_code, view: "en_difficulte" },
  },
];

scenarioEval({
  suite: "Synthèse d'un territoire",
  group: "synthese",
  grid: GRIDS.syntheseTerritoire,
  cases: [
    {
      question: "Fais moi la synthèse du territoire Bretagne",
      reason: "Trou complété par le territoire courant",
      truthScope: { territoires: ["REG-53"] },
      expected: workflowSynthese("REG-53"),
    },
    {
      question: "Fais moi la synthèse du territoire Finistère",
      reason: "Trou complété par un département, par son nom",
      truthScope: { territoires: ["DEPT-29"] },
      expected: workflowSynthese("DEPT-29"),
    },
    {
      question: "Fais moi la synthèse du territoire 35",
      reason:
        "Trou complété par un numéro de département seul : DEPT-35, pas le territoire courant",
      truthScope: { territoires: ["DEPT-35"] },
      expected: workflowSynthese("DEPT-35"),
    },
  ],
});
