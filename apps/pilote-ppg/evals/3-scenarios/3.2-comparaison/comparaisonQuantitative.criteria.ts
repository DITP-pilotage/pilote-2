import { BASE_IDS, withBase } from "../criterion";
import {
  TABLEAU_COMPARATIF,
  TERRITOIRES_DU_TABLEAU,
  ANALYSE_DES_ECARTS,
  POSITION_MEDIANE,
} from "../criteria/comparaison";

/** Les critères du scénario « Comparaison quantitative des territoires ». */
export const COMPARAISON_QUANTITATIVE_CRITERIA = withBase({
  omit: [BASE_IDS.restriction],
  criteria: [
    TABLEAU_COMPARATIF,
    TERRITOIRES_DU_TABLEAU,
    ANALYSE_DES_ECARTS,
    POSITION_MEDIANE,
  ],
});
