import { scenarioEval } from "../scenarioEval";
import { SYNTHESE_TERRITOIRE_CRITERIA } from "./syntheseTerritoire.criteria";

/**
 * Scénario « Synthèse des difficultés d'un territoire » (coordinateur, à
 * compléter) : « Fais moi la synthèse des difficultés du territoire ».
 *
 * Choix arbitraire, à valider côté produit : « les difficultés » passe par
 * `synthese_territoire`, qui rend les deux vues (en retard et en difficulté)
 * et le gabarit de synthèse territoriale. Les primitives sont interdites : un
 * appel en plus sur le même périmètre signale que le LLM orchestre encore.
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
 * Run du 2026-10-14, juge mistral-medium-3-5 : outils 59 %, forme 71 %, fond
 * 87 % ; échecs : Chantiers attendus 0/9, Absence de commentaire signalée 3/6,
 * Écart et météo 6/9, Pas de recopie 6/9, Pas d'opinion 8/9, Résumés fidèles
 * 8/9.
 * Run du 2026-10-26, après le passage à `synthese_territoire` : score 88 % ;
 * « Chantiers attendus » passe de 0/9 à 6/9 ; échecs : Outils attendus 6/9
 * (la Bretagne lue comme la seule vue en difficulté, 3/3), Pas de recopie
 * 6/9, Absence de commentaire signalée 6/9, Libellés météo 8/9.
 */

const workflowSynthese = (territoire_code: string) => [
  { toolName: "synthese_territoire", input: { territoire_code } },
];

const PRIMITIVES = ["get_chantiers", "get_taux_avancement_territoire"];

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
      forbidden: PRIMITIVES,
    },
    {
      question: "Fais moi la synthèse des difficultés du territoire Finistère",
      reason: "Un département du périmètre",
      truthScope: { territoires: ["DEPT-29"] },
      expected: workflowSynthese("DEPT-29"),
      forbidden: PRIMITIVES,
    },
    {
      question:
        "Fais moi la synthèse des difficultés du territoire Pays de la Loire",
      reason: "Hors périmètre : commentaires masqués, restriction à signaler",
      truthScope: { territoires: ["REG-52"] },
      expected: workflowSynthese("REG-52"),
      forbidden: PRIMITIVES,
    },
  ],
});
