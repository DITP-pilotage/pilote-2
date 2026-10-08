import { withBase } from "../criterion";
import {
  TABLEAU_COMPARATIF,
  TERRITOIRES_DU_TABLEAU,
  ANALYSE_DES_ECARTS,
  POSITION_MEDIANE,
} from "../criteria/comparaison";

/** Les critères du scénario « Comparer avec un autre territoire ». */
export const COMPARER_TERRITOIRES_CRITERIA = withBase({
  criteria: [
    TABLEAU_COMPARATIF,
    TERRITOIRES_DU_TABLEAU,
    ANALYSE_DES_ECARTS,
    POSITION_MEDIANE,
  ],
});
