import { scenarioEval } from "../scenarioEval";
import { COMMENTAIRES_RESTITUES_CRITERIA } from "./commentairesRestitues.criteria";

/**
 * Scénario « Commentaires restitués » (PIL-1900, D2).
 *
 * Les commentaires sont restitués fidèlement par défaut, et résumés seulement
 * quand l'utilisateur le demande ; le résumé demandé relève de « Synthèse des
 * commentaires ». Le prompt d'origine disait « condense » quand l'outil disait
 * « verbatim » : le cas mesure la restitution quand rien ne demande de
 * synthèse.
 */

scenarioEval({
  suite: "Commentaires restitués",
  group: "forme",
  criteria: COMMENTAIRES_RESTITUES_CRITERIA,
  profile: "coordinateur",
  cases: [
    {
      question: "Quels sont les commentaires du CH-001 en Bretagne ?",
      reason: "Restitution par défaut, sans demande de synthèse (D2)",
      truthScope: { territoires: ["REG-53"], chantiersCommentes: ["CH-001"] },
      expected: [
        {
          toolName: "get_chantier_commentaires",
          input: {
            chantier_id: "CH-001",
            perimetre: { type: "SELECTION", territoire_codes: ["REG-53"] },
          },
        },
      ],
    },
  ],
});
