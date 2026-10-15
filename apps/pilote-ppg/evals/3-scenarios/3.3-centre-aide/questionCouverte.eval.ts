import { scenarioEval } from "../scenarioEval";
import { PAGE_IMPORT, PAGE_TAUX, seedCentreAide } from "../../seedCentreAide";
import { criteresQuestionCouverte } from "./centreAide.criteria";

/**
 * Scénario « Question couverte par le centre d'aide » (PIL-1863). Une
 * définition que le glossaire du prompt connaît aussi, et une procédure qu'il
 * ne connaît pas. Le centre d'aide semé contient une page masquée, un groupe
 * dépublié et un brouillon, chacun marqué : rien ne doit en sortir.
 *
 * Référence observée le 2026-10-15 : 99 %. Seul échec, « Fidèle au centre
 * d'aide » 5/6 : sur l'import, l'agent ajoute des détails absents de la page
 * (format Excel ou CSV, colonnes du fichier).
 */

const QUESTION_TAUX =
  "Comment est calculé le taux d'avancement d'un chantier ?";
const QUESTION_IMPORT = "Comment importer les mesures de mes indicateurs ?";

scenarioEval({
  suite: "Question couverte par le centre d'aide",
  group: "aide",
  seedSupplementaire: seedCentreAide,
  criteria: criteresQuestionCouverte({
    [QUESTION_TAUX]: PAGE_TAUX,
    [QUESTION_IMPORT]: PAGE_IMPORT,
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
      reason: "procédure, avec une ancienne version masquée",
      truthScope: { territoires: ["REG-53"] },
      expected: [{ toolName: "consulter_centre_aide" }],
    },
  ],
});
