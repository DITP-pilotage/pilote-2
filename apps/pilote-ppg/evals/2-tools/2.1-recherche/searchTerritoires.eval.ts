import type { ToolCase } from "../../types";
import { toolSelectionEval } from "../toolSelectionEval";

/**
 * Niveau 2 — `search_territoires`.
 *
 * L'agent appelle l'outil pour résoudre le code métier d'un territoire que
 * l'utilisateur désigne par son nom ou un acronyme (« PACA » plutôt que REG-93), le
 * plus souvent avant de le passer à un autre outil.
 *
 * Un numéro de département (« le 84 ») ou de région explicite (« la région
 * 84 ») se traduit en code sans recherche (PIL-1900, étape 7) : tout code de
 * région est aussi un numéro de département, le numéro seul désigne donc le
 * département (D3). Seul un numéro sans département (« le 20 ») se recherche.
 * Le code finalement transmis relève du niveau 3.
 */

const CASES: ToolCase[] = [
  {
    question: "Quel est le taux d'avancement de PACA ?",
    reason: "acronyme de région : le code est à résoudre",
    expected: [{ toolName: "search_territoires" }],
  },
  {
    question: "Où en est AURA sur le taux d'avancement ?",
    reason: "acronyme de région : le code est à résoudre",
    expected: [{ toolName: "search_territoires" }],
  },
  {
    question: "Quel est le taux d'avancement dans le 84 ?",
    reason: "numéro seul : le département 84 (D3), sans recherche",
    expected: [
      {
        toolName: "get_taux_avancement_territoire",
        input: {
          perimetre: { type: "SELECTION", territoire_codes: ["DEPT-84"] },
        },
      },
    ],
    forbidden: ["search_territoires"],
  },
  {
    question: "Quel est le taux d'avancement de la région 84 ?",
    reason: "« région » explicite : REG-84, sans recherche",
    expected: [
      {
        toolName: "get_taux_avancement_territoire",
        input: {
          perimetre: { type: "SELECTION", territoire_codes: ["REG-84"] },
        },
      },
    ],
    forbidden: ["search_territoires"],
  },
  {
    question: "Quel est le taux d'avancement du département 84 ?",
    reason: "« département » explicite : DEPT-84, sans recherche",
    expected: [
      {
        toolName: "get_taux_avancement_territoire",
        input: {
          perimetre: { type: "SELECTION", territoire_codes: ["DEPT-84"] },
        },
      },
    ],
    forbidden: ["search_territoires"],
  },
  {
    question: "Quel est le taux d'avancement du 20 ?",
    reason: "aucun département 20 (la Corse est en 2A et 2B) : la recherche",
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
