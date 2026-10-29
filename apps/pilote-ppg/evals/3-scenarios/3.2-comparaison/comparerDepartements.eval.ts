import { scenarioEval } from "../scenarioEval";
import { ENCART_CRITERIA } from "../criteria/encart";
import { COMPARER_DEPARTEMENTS_CRITERIA } from "./comparerDepartements.criteria";

/**
 * Scénario « Comparer Bretagne avec ses départements » (DITP, envoyé,
 * territoire courant régional).
 *
 * Attente stricte, décidée en revue : UN SEUL appel avec le périmètre
 * REGION_ET_SES_DEPARTEMENTS de REG-53. Le prompt interdit d'énumérer les
 * départements ; une énumération échoue « Outils attendus ».
 *
 * « avec ses départements » ne déclenche pas le mot-clé du détecteur, qui
 * attend « et ses départements » : la consigne impérative sur les
 * sous-territoires n'est pas injectée (PIL-1833, point 12).
 *
 * Référence observée le 2026-09-30 : outils 100 %, forme 100 %, fond 50 %.
 * Un seul appel avec les sous-territoires (3/3), malgré l'absence de la
 * consigne. Pas d'analyse des écarts (0/3).
 * Second run du 2026-09-30 : outils 100 %, forme 100 %, fond 50 %.
 * Run du 2026-10-14, juge mistral-medium-3-5 : outils 100 %, forme 100 %, fond
 * 73 % ; échecs : Analyse des écarts 0/3, Tableau comparatif 2/3.
 */

scenarioEval({
  suite: "Comparer Bretagne avec ses départements",
  group: "comparaison",
  criteria: [...COMPARER_DEPARTEMENTS_CRITERIA, ...ENCART_CRITERIA],
  matter: "encart",
  cases: [
    {
      question: "Compare Bretagne avec ses départements",
      reason: "Message envoyé tel quel",
      truthScope: {
        territoires: ["REG-53"],
        perimetre: {
          type: "REGION_ET_SES_DEPARTEMENTS",
          region_code: "REG-53",
        },
      },
      expected: [
        {
          toolName: "rediger_comparaison_territoires",
          input: {
            perimetre: {
              type: "REGION_ET_SES_DEPARTEMENTS",
              region_code: "REG-53",
            },
          },
        },
      ],
      tableTerritories: ["REG-53", "DEPT-22", "DEPT-29", "DEPT-35", "DEPT-56"],
    },
  ],
});
