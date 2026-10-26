import { scenarioEval } from "../scenarioEval";
import { SYNTHESE_TERRITOIRE_CRITERIA } from "./syntheseTerritoire.criteria";

/**
 * Scénario « Synthèse d'un territoire » (DITP, à compléter) :
 * « Fais moi la synthèse du territoire ». Le trou est complété par le
 * territoire courant, un département par son nom, un département par son
 * numéro.
 *
 * Le gabarit écrit « le TA de la région » quel que soit le territoire : le
 * critère « Maille nommée » le mesure sur les deux départements.
 *
 * La synthèse passe par un seul appel à `synthese_territoire`, qui porte le
 * gabarit ; les primitives sont interdites sur le même périmètre.
 *
 * Référence observée le 2026-09-30 : outils 93 %, forme 87 %, fond 94 %.
 * Le commentaire de synthèse de CH-005 est recopié (0/3 sur la Bretagne et
 * le 35). Sur le Finistère, un essai sur trois conclut « aucun chantier en
 * retard » sans avoir interrogé les vues, et un autre écrit « le TA de la
 * région » pour un département.
 * Second run du 2026-09-30 : outils 93 %, forme 86 %, fond 97 %.
 * Run du 2026-10-14, juge mistral-medium-3-5 : outils 100 %, forme 87 %, fond
 * 92 % ; échecs : Pas de recopie 2/9, Écart et météo 7/9, Pas d'opinion 8/9.
 * Run du 2026-10-26, après le passage à `synthese_territoire` : score 92 % ;
 * outils 9/9 ; échecs : Pas de recopie 3/9, Absence de commentaire signalée
 * 7/9, Pas d'opinion 8/9.
 */

const workflowSynthese = (territoire_code: string) => [
  { toolName: "synthese_territoire", input: { territoire_code } },
];

const PRIMITIVES = ["get_chantiers", "get_taux_avancement_territoire"];

scenarioEval({
  suite: "Synthèse d'un territoire",
  group: "synthese",
  criteria: SYNTHESE_TERRITOIRE_CRITERIA,
  cases: [
    {
      question: "Fais moi la synthèse du territoire Bretagne",
      reason: "Trou complété par le territoire courant",
      truthScope: { territoires: ["REG-53"] },
      expected: workflowSynthese("REG-53"),
      forbidden: PRIMITIVES,
    },
    {
      question: "Fais moi la synthèse du territoire Finistère",
      reason: "Trou complété par un département, par son nom",
      truthScope: { territoires: ["DEPT-29"] },
      expected: workflowSynthese("DEPT-29"),
      forbidden: PRIMITIVES,
    },
    {
      question: "Fais moi la synthèse du territoire 35",
      reason:
        "Trou complété par un numéro de département seul : DEPT-35, pas le territoire courant",
      truthScope: { territoires: ["DEPT-35"] },
      expected: workflowSynthese("DEPT-35"),
      forbidden: PRIMITIVES,
    },
  ],
});
