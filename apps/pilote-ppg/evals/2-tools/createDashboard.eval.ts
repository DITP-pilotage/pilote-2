import type { ToolCase } from "../types";
import { toolSelectionEval } from "./toolSelectionEval";

/**
 * Niveau 2 — `create_dashboard`.
 *
 * L'outil n'est exposé que si `detecterCapacities` repère l'intention
 * dashboard : un échec ici peut venir du détecteur (niveau 1) autant que de
 * l'agent. Le cas négatif distingue les deux — s'il déclenche quand même
 * l'outil, c'est le détecteur qui sur-déclenche.
 *
 * Référence observée le 2026-09-10 : 100 % sur 9 essais.
 *
 * À rapprocher d'`export_rapport`, à 67 % sur des cas de même forme : quand la
 * demande porte sur une VISUALISATION, l'agent appelle l'outil ; quand elle
 * porte sur un FICHIER, il rédige à la place. Le détecteur d'intention expose
 * les deux outils de la même façon — la différence vient de l'agent.
 */

const CASES: ToolCase[] = [
  {
    question:
      "Compose un tableau de bord de la Bretagne avec le taux d'avancement et les chantiers en retard",
    reason: "demande de dashboard explicite, données disponibles",
    expected: [
      { toolName: "get_taux_avancement_territoire" },
      { toolName: "get_chantiers", input: { view: "en_retard" } },
      { toolName: "create_dashboard" },
    ],
  },
  {
    question: "Affiche-moi un cockpit de la Bretagne",
    reason: "« cockpit » est un synonyme dashboard du détecteur d'intention",
    expected: [{ toolName: "create_dashboard" }],
  },
  {
    question: "Quel est le taux d'avancement de la Bretagne ?",
    reason:
      "CAS NÉGATIF : question factuelle, aucune intention de visualisation",
    expected: [{ toolName: "get_taux_avancement_territoire" }],
  },
];

toolSelectionEval({
  famille: "rendu",
  tool: "create_dashboard",
  cases: CASES,
});
