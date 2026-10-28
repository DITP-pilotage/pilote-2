import { BASE_IDS, mechanical, withBase } from "../criterion";
import { checkDashboardNonVide } from "../mechanicalChecks";

/** Les critères du scénario « Dashboard sans chantier ». */
export const DASHBOARD_SANS_CHANTIER_CRITERIA = withBase({
  // Le format CH-XXX — Nom vaut pour la prose : la matière d'un dashboard
  // est une liste de widgets, dont les paramètres portent les codes seuls.
  omit: [BASE_IDS.restriction, BASE_IDS.chantierFormat],
  criteria: [
    mechanical({
      id: "Pas de dashboard vide",
      rule: "PIL-1900 : aucun dashboard vide n'est présenté comme un succès",
      check: (evidence) =>
        checkDashboardNonVide({ dashboard: evidence.dashboard }),
    }),
  ],
});
