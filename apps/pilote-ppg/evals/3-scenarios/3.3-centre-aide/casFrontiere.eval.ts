import { scenarioEval } from "../scenarioEval";
import { seedCentreAide } from "../../seedCentreAide";
import { criteresCasFrontiere } from "./centreAide.criteria";

/**
 * Scénario « Cas frontière aide / donnée » (PIL-1863, point d'attention de
 * la recette). Après l'affichage du taux d'un indicateur, « comment est
 * calculé ce taux ? » est une question d'aide : l'assistant consulte le
 * centre d'aide et donne la définition, sans question de clarification.
 *
 * Il ne pose pas le calcul sur les valeurs de la conversation : une consigne
 * qui le lui demandait l'a fait inventer VI, VA et VC (« VI = 0 %, VA = 30 %,
 * VC = 100 % » au lieu de 280, 250 et 180). Une définition juste vaut mieux
 * qu'un calcul faux.
 *
 * IND-005 (CH-005) est semé en Bretagne au jalon courant : VI 280, VA 250,
 * VC 180, TA 30 %.
 *
 * Référence observée le 2026-10-15 : 100 %, aucun chiffre inventé.
 */

scenarioEval({
  suite: "Cas frontière aide / donnée",
  group: "aide",
  seedSupplementaire: seedCentreAide,
  criteria: criteresCasFrontiere,
  cases: [
    {
      history: [
        "Quel est le taux d'avancement de l'indicateur IND-005 en Bretagne ?",
      ],
      question: "Comment est calculé ce taux ?",
      reason: "« ce taux » renvoie au tour précédent",
      truthScope: { territoires: ["REG-53"], indicateurs: true },
      expected: [{ toolName: "consulter_centre_aide" }],
      forbidden: ["clarify_with_choices"],
    },
  ],
});
