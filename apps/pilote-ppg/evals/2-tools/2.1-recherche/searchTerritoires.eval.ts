import type { ToolCase } from "../../types";
import { toolSelectionEval } from "../toolSelectionEval";

/**
 * Niveau 2 — `search_territoires`.
 *
 * L'agent appelle l'outil pour résoudre le code métier d'un territoire que
 * l'utilisateur désigne par son nom (« le Vaucluse » plutôt que DEPT-84) ou par
 * un numéro, le plus souvent avant de le passer à un autre outil.
 *
 * Les territoires désignés par un numéro (« le 84 ») sont mis de côté dans
 * `numerosTerritoires.enAttente.ts` (PIL-1900, étape 5) : leur traitement
 * attend la décision sur la résolution des territoires dans le code. Le code
 * finalement transmis relève du niveau 3.
 */

const CASES: ToolCase[] = [
  {
    question: "Quel est le taux d'avancement du Vaucluse ?",
    reason: "territoire désigné par son nom : le code est à résoudre",
    expected: [{ toolName: "search_territoires" }],
  },
  {
    question: "Quel est le taux d'avancement de REG-84 ?",
    reason: "CAS NÉGATIF : code explicite, rien à rechercher",
    expected: [{ toolName: "get_taux_avancement_territoire" }],
    forbidden: ["search_territoires"],
  },
];

toolSelectionEval({
  famille: "recherche",
  tool: "search_territoires",
  cases: CASES,
});
