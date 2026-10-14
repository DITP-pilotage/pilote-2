import { withBase } from "../criterion";
import { COMMENTAIRES_DU_GABARIT } from "../criteria/commentaires";
import {
  TABLEAU_COMPARATIF_JUGE,
  ANALYSE_DES_ECARTS,
} from "../criteria/comparaison";

/** Les critères du scénario « Synthèse d'une région et de ses départements ». */
export const SYNTHESE_DEPARTEMENTS_CRITERIA = withBase({
  criteria: [
    TABLEAU_COMPARATIF_JUGE,
    ANALYSE_DES_ECARTS,
    ...COMMENTAIRES_DU_GABARIT,
  ],
});
