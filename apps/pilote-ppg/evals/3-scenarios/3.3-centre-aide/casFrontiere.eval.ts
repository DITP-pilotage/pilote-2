import { scenarioEval } from "../scenarioEval";
import { seedCentreAide } from "../../seedCentreAide";
import { criteresCasFrontiere } from "./centreAide.criteria";

/**
 * Scénario « Cas frontière aide / donnée » (PIL-1863, point d'attention de
 * la recette). Après l'affichage du taux d'un indicateur, « comment est
 * calculé ce taux ? » demande la définition ET son application aux valeurs
 * affichées, sans question de clarification.
 *
 * IND-005 (CH-005) est semé en Bretagne au jalon courant : VI 280, VA 250,
 * VC 180, TA 30 %. IND-894 ne l'est pas, et l'agent n'avait alors aucune
 * valeur à laquelle appliquer la formule.
 *
 * Référence observée le 2026-10-15 : 92 %. « Définition appliquée » 0/3 :
 * l'agent appelle le centre d'aide et donne la formule, sans l'appliquer aux
 * valeurs reçues au tour précédent. Une consigne qui le forçait à poser le
 * calcul l'a fait inventer VI, VA et VC (« Chiffres exacts » 1/3) : elle a
 * été retirée, un chiffre inventé est pire qu'une formule non appliquée.
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
