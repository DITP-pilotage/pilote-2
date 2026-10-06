import { scenarioEval } from "../scenarioEval";
import { SYNTHESE_TERRITOIRE_CRITERIA } from "./syntheseTerritoire.criteria";

/**
 * Scénario « Synthèse des difficultés d'un territoire » (coordinateur, à
 * compléter) : « Fais moi la synthèse des difficultés du territoire ».
 *
 * Choix arbitraire, à valider côté produit : « les difficultés » suit le
 * workflow de synthèse que déclenche le mot « synthèse », donc les deux vues
 * (en retard et en difficulté), et la grille de synthèse territoriale.
 *
 * Les Pays de la Loire sont hors du périmètre du coordinateur : leurs
 * commentaires et tendances sont masqués, « Restriction signalée »
 * s'applique.
 *
 * Référence observée le 2026-09-30 : outils 63 %, forme 64 %, fond 94 %.
 * Albert lit « les difficultés » comme la seule vue en difficulté : la vue
 * en retard n'est jamais interrogée (0/3 sur chaque cas), d'où un gabarit
 * incomplet. « Pas de commentaire disponible » manque sous CH-006 (0/3 sur
 * la Bretagne).
 * Second run du 2026-09-30 : outils 78 %, forme 67 %, fond 94 %.
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
  suite: "Synthèse des difficultés d'un territoire",
  group: "synthese",
  criteria: SYNTHESE_TERRITOIRE_CRITERIA,
  profile: "coordinateur",
  cases: [
    {
      question: "Fais moi la synthèse des difficultés du territoire Bretagne",
      reason: "Trou complété par le territoire courant",
      truthScope: { territoires: ["REG-53"] },
      expected: workflowSynthese("REG-53"),
    },
    {
      question: "Fais moi la synthèse des difficultés du territoire Finistère",
      reason: "Un département du périmètre",
      truthScope: { territoires: ["DEPT-29"] },
      expected: workflowSynthese("DEPT-29"),
    },
    {
      question:
        "Fais moi la synthèse des difficultés du territoire Pays de la Loire",
      reason: "Hors périmètre : commentaires masqués, restriction à signaler",
      truthScope: { territoires: ["REG-52"] },
      expected: workflowSynthese("REG-52"),
    },
  ],
});
