import type { ToolCase } from "../types";
import { toolSelectionEval } from "./toolSelectionEval";

/**
 * Niveau 2 — `search_territoires`.
 *
 * L'agent appelle l'outil pour résoudre le code métier d'un territoire que
 * l'utilisateur désigne par son nom (« le Vaucluse » plutôt que DEPT-84) ou par
 * un numéro, le plus souvent avant de le passer à un autre outil.
 *
 * Tout code de région est aussi un numéro de département : REG-84 est
 * Auvergne-Rhône-Alpes, DEPT-84 le Vaucluse. Un numéro doit donc passer par la
 * recherche, qui renvoie tout ce qui correspond ; choisir entre les candidats
 * relève de la suite de la conversation, pas de ce niveau. Les cas « région 84 »
 * et « département 84 » vérifient que la précision de maille ne dispense pas
 * l'agent de la recherche. Le code finalement transmis relève du niveau 3.
 */

const CASES: ToolCase[] = [
  {
    question: "Quel est le taux d'avancement du Vaucluse ?",
    reason: "territoire désigné par son nom : le code est à résoudre",
    expected: [{ toolName: "search_territoires" }],
  },
  {
    question: "Quel est le taux d'avancement dans le 84 ?",
    reason: "numéro seul : 84 est à la fois une région et un département",
    expected: [{ toolName: "search_territoires" }],
  },
  {
    question: "Quel est le taux d'avancement de la région 84 ?",
    reason: "numéro précisé « région » : la recherche reste nécessaire",
    expected: [{ toolName: "search_territoires" }],
  },
  {
    question: "Quel est le taux d'avancement du département 84 ?",
    reason: "numéro précisé « département » : la recherche reste nécessaire",
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
