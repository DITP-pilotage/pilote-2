import { scenarioEval } from "../scenarioEval";
import { seedCentreAide } from "../../seedCentreAide";
import { criteresHorsCorpus } from "./centreAide.criteria";

/**
 * Scénario « Question hors du centre d'aide » (PIL-1863). Le centre d'aide
 * semé ne parle pas d'usage sur smartphone, pas plus que le réel : l'assistant
 * doit le dire et renvoyer vers l'équipe PILOTE, sans répondre de mémoire.
 *
 * Référence observée le 2026-10-15 : 100 %.
 */

scenarioEval({
  suite: "Question hors du centre d'aide",
  group: "aide",
  seedSupplementaire: seedCentreAide,
  criteria: criteresHorsCorpus,
  cases: [
    {
      question: "Est-ce que je peux utiliser PILOTE depuis mon smartphone ?",
      reason: "aucune page ne traite la question",
      truthScope: { territoires: ["REG-53"] },
      expected: [{ toolName: "consulter_centre_aide" }],
    },
  ],
});
