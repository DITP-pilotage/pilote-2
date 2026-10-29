import { scenarioEval } from "../scenarioEval";
import { TABLEAU_DEMANDE_CRITERIA } from "./tableauDemande.criteria";

/**
 * Scénario « Tableau demandé » (PIL-1900, cloisonnement).
 *
 * Le prompt d'origine interdit les tableaux pour les listes de chantiers :
 * une règle née du gabarit de synthèse, qui s'appliquait à toutes les
 * réponses. Le cas mesure qu'une règle de format née d'un usage ne bloque pas
 * une autre demande : quand l'utilisateur demande un tableau, il l'obtient.
 */

scenarioEval({
  suite: "Tableau demandé",
  group: "forme",
  criteria: TABLEAU_DEMANDE_CRITERIA,
  cases: [
    {
      question: "Fais-moi un tableau des chantiers en retard en Bretagne",
      reason:
        "Tableau demandé sur une liste de chantiers : le prompt actuel l'interdit",
      truthScope: { territoires: ["REG-53"] },
      expected: [
        {
          toolName: "get_chantiers",
          input: {
            perimetre: { type: "SELECTION", territoire_codes: ["REG-53"] },
            view: "en_retard",
          },
        },
      ],
    },
  ],
});
