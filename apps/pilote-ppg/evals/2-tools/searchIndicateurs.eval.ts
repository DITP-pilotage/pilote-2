import type { ToolCase } from "../types";
import { toolSelectionEval } from "./toolSelectionEval";

/**
 * Niveau 2 — `search_indicateurs`.
 *
 * Le cas négatif est le plus important de la suite : le prompt système interdit
 * de rechercher quand l'identifiant du chantier est déjà fourni.
 *
 * Référence observée le 2026-09-10 : 100 % sur 9 essais.
 */

const CASES: ToolCase[] = [
  {
    question:
      "Quel indicateur mesure la rénovation énergétique des logements ?",
    reason: "libellé d'indicateur en langage naturel, sans identifiant",
    expected: [{ toolName: "search_indicateurs" }],
  },
  {
    question: "Trouve-moi l'indicateur sur les déserts médicaux",
    reason: "thématique d'indicateur, pas de chantier nommé",
    expected: [{ toolName: "search_indicateurs" }],
  },
  {
    question:
      "Donne-moi les indicateurs du chantier CH-007 pour la France entière",
    reason:
      "CAS NÉGATIF : chantier identifié, on récupère ses indicateurs sans recherche",
    expected: [
      { toolName: "get_indicateurs", input: { chantier_id: "CH-007" } },
    ],
  },
];

toolSelectionEval({
  famille: "recherche",
  tool: "search_indicateurs",
  cases: CASES,
});
