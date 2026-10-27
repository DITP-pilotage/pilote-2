import { scenarioEval } from "../scenarioEval";
import { DASHBOARD_SANS_CHANTIER_CRITERIA } from "./dashboardSansChantier.criteria";

/**
 * Scénario « Dashboard sans chantier » (PIL-1900, point 4).
 *
 * La carte des météos n'affiche la météo que d'un chantier par territoire.
 * Demandée sans chantier, elle donnait un dashboard vide (« Aucune donnée de
 * chantier disponible pour la carte météo »), présenté comme un succès
 * (« Voici le tableau de bord demandé. »). L'agent doit plutôt demander pour
 * quel chantier, ou dire ce qu'il ne peut pas afficher.
 */

scenarioEval({
  suite: "Dashboard sans chantier",
  group: "synthese",
  criteria: DASHBOARD_SANS_CHANTIER_CRITERIA,
  matter: "dashboard",
  cases: [
    {
      question: "Affiche la carte des météos des chantiers en Bretagne",
      reason:
        "Carte qui exige un chantier, demandée sans chantier (PIL-1900, point 4)",
      truthScope: { territoires: ["REG-53"] },
    },
  ],
});
