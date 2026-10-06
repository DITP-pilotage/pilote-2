import { BASE_IDS, withBase } from "../criterion";
import {
  TABLEAU_COMPARATIF_JUGE,
  ANALYSE_DES_ECARTS,
  POSITION_MEDIANE,
} from "../criteria/comparaison";

/** Les critères du scénario « Comparer une région avec ses départements ». */
export const COMPARER_DEPARTEMENTS_CRITERIA = withBase({
  omit: [BASE_IDS.restriction],
  criteria: [TABLEAU_COMPARATIF_JUGE, ANALYSE_DES_ECARTS, POSITION_MEDIANE],
});
