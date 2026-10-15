import { scenarioEval } from "../scenarioEval";
import { seedCentreAide } from "../../seedCentreAide";
import { criteresHorsCorpus } from "./centreAide.criteria";

/**
 * Scénario « Question hors du centre d'aide » (PIL-1863). La première
 * question n'a aucune page. La seconde n'a de réponse que dans une page
 * dépubliée : l'assistant ne doit ni la trouver ni en citer le contenu.
 *
 * Référence observée le 2026-10-15 : 100 %. Aucune fuite du groupe dépublié.
 */

const QUESTION_ALERTES =
  "Est-ce que je peux recevoir une alerte par mail quand un indicateur est mis à jour ?";
const QUESTION_ARCHIVE = "Comment se demandait l'export des données en 2024 ?";

scenarioEval({
  suite: "Question hors du centre d'aide",
  group: "aide",
  seedSupplementaire: seedCentreAide,
  criteria: criteresHorsCorpus([QUESTION_ALERTES]),
  cases: [
    {
      question: QUESTION_ALERTES,
      reason: "aucune page ne traite la question",
      truthScope: { territoires: ["REG-53"] },
      expected: [{ toolName: "consulter_centre_aide" }],
    },
    {
      question: QUESTION_ARCHIVE,
      reason: "réponse seulement dans un groupe dépublié",
      truthScope: { territoires: ["REG-53"] },
      expected: [{ toolName: "consulter_centre_aide" }],
    },
  ],
});
