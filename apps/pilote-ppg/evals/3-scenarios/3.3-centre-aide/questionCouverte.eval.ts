import { scenarioEval } from "../scenarioEval";
import {
  PAGE_MISE_A_JOUR_INDICATEURS,
  PAGE_PREPARER_FICHIER,
  PAGE_TAUX_AVANCEMENT,
  seedCentreAide,
} from "../../seedCentreAide";
import { criteresQuestionCouverte } from "./centreAide.criteria";

/**
 * Scénario « Question couverte par le centre d'aide » (PIL-1863). Une
 * définition que le glossaire du prompt connaît aussi, et une procédure qu'il
 * ne connaît pas, sur un centre d'aide fictif inspiré du réel.
 *
 * Référence observée le 2026-10-15 : 100 %.
 */

const QUESTION_TAUX =
  "Comment est calculé le taux d'avancement d'un chantier ?";
const QUESTION_IMPORT = "Comment importer les mesures de mes indicateurs ?";

scenarioEval({
  suite: "Question couverte par le centre d'aide",
  group: "aide",
  seedSupplementaire: seedCentreAide,
  criteria: criteresQuestionCouverte({
    [QUESTION_TAUX]: [PAGE_TAUX_AVANCEMENT],
    [QUESTION_IMPORT]: [PAGE_PREPARER_FICHIER, PAGE_MISE_A_JOUR_INDICATEURS],
  }),
  cases: [
    {
      question: QUESTION_TAUX,
      reason: "définition concurrente du glossaire",
      truthScope: { territoires: ["REG-53"] },
      expected: [{ toolName: "consulter_centre_aide" }],
    },
    {
      question: QUESTION_IMPORT,
      reason: "procédure répartie sur deux pages",
      truthScope: { territoires: ["REG-53"] },
      expected: [{ toolName: "consulter_centre_aide" }],
    },
  ],
});
