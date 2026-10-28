import type { Evidence } from "../evidence";
import { judged, mechanical } from "../criterion";
import { checkHasTable, checkTableTerritories } from "../mechanicalChecks";

const nomsDuTableau = (evidence: Evidence) =>
  evidence.tableTerritories.map(
    (code) =>
      evidence.truth.territoires.find((territoire) => territoire.code === code)
        ?.nom ?? code,
  );

export const TABLEAU_COMPARATIF = mechanical({
  id: "Tableau comparatif",
  rule: "Rédiger : comparaison de territoires → un tableau",
  check: (evidence) => checkHasTable({ text: evidence.matter }),
});

export const TERRITOIRES_DU_TABLEAU = mechanical({
  id: "Territoires du tableau",
  rule: "Demande : les territoires du tableau, désignés par leur nom",
  check: (evidence) =>
    checkTableTerritories({
      text: evidence.matter,
      noms: nomsDuTableau(evidence),
    }),
});

/**
 * Le même tableau, vérifié par le juge plutôt que par une regex : les
 * synthèses d'une région avec ses départements suivent un gabarit appelé à
 * changer, et la forme du tableau avec lui.
 */
export const TABLEAU_COMPARATIF_JUGE = judged({
  id: "Tableau comparatif",
  rule: "Rédiger : comparaison de territoires → un tableau, chaque territoire désigné par son nom",
  instruction:
    "La réponse présente les taux d'avancement des territoires listés dans TERRITOIRES QUE LE TABLEAU DE LA RÉPONSE DOIT CONTENIR sous forme de tableau, une ligne par territoire, chacun désigné par son nom officiel. Lis chaque ligne du tableau de la matière et cite comment elle désigne son territoire. Un territoire absent du tableau, ou désigné seulement par son code ou son numéro (« DEPT-35 », « 35 »), est non conforme.",
});

export const ANALYSE_DES_ECARTS = judged({
  id: "Analyse des écarts",
  rule: "Demande : comparer, qui est devant, qui est derrière, de combien de points",
  instruction:
    "La réponse dit quel territoire est devant, lequel est derrière, et de combien de points de taux d'avancement. Le territoire annoncé devant doit être celui dont le taux est le plus élevé dans les données reçues : un classement inversé est non conforme, même si les chiffres cités sont justes.",
});

export const POSITION_MEDIANE = judged({
  id: "Position face à la médiane",
  rule: "Métier : écart à la médiane de la même maille, en retard ≤ −10, en avance ≥ +10, dans la médiane entre les deux",
  instruction:
    "Chaque territoire est situé face à la médiane de SA maille (une région face aux régions, un département face aux départements), avec la position rendue par les données (en retard, dans la médiane, en avance).",
});
