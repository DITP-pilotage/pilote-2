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
  rule: "get_taux_avancement_territoire : plusieurs territoires → tableau comparatif ; Tableaux autorisés pour les comparaisons",
  check: (evidence) => checkHasTable({ text: evidence.matter }),
});

export const TERRITOIRES_DU_TABLEAU = mechanical({
  id: "Territoires du tableau",
  rule: "Format : codes et noms officiels des territoires",
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
  rule: "get_taux_avancement_territoire : plusieurs territoires → tableau comparatif ; codes et noms officiels des territoires",
  instruction:
    "La réponse présente les taux d'avancement des TERRITOIRES ATTENDUS DANS LE TABLEAU sous forme de tableau, une ligne par territoire, chacun désigné par son nom officiel. Un territoire absent du tableau, ou désigné seulement par son code ou son numéro, est non conforme.",
});

export const ANALYSE_DES_ECARTS = judged({
  id: "Analyse des écarts",
  rule: "Comparaison : décris factuellement qui est en avance, qui est en retard, de combien de points",
  instruction:
    "La réponse dit quel territoire est devant, lequel est derrière, et de combien de points de taux d'avancement. Le territoire annoncé devant doit être celui dont le taux est le plus élevé dans les données reçues : un classement inversé est non conforme, même si les chiffres cités sont justes.",
});

export const POSITION_MEDIANE = judged({
  id: "Position face à la médiane",
  rule: "Écart à la médiane : EN RETARD <= -10, EN AVANCE >= +10, DANS LA MÉDIANE entre les deux",
  instruction:
    "Chaque territoire est situé face à la médiane de SA maille (une région face aux régions, un département face aux départements), avec la position rendue par les données (en retard, dans la médiane, en avance).",
});
