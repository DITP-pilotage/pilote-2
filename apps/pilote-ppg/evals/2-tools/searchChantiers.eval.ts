import type { ToolCase } from "../types";
import { toolSelectionEval } from "./toolSelectionEval";

/**
 * Niveau 2 — `search_chantiers`.
 *
 * `seedEvalWorld` sème vingt chantiers groupés par thème et volontairement
 * proches : trois sur les violences faites aux femmes, trois sur la santé,
 * trois sur le logement, deux sur le handicap. C'est ce qui rend la recherche
 * discriminante — l'outil injecte la liste entière dans le prompt de son
 * sous-agent.
 *
 * Référence observée le 2026-09-10 : 100 % sur 9 essais. La recherche thematique discrimine bien parmi les vingt chantiers semes.
 */

const CASES: ToolCase[] = [
  {
    question:
      "Quels sont les chantiers qui traitent des violences sexistes et sexuelles ?",
    reason: "thématique sans identifiant : passe par la recherche sémantique",
    expected: [{ toolName: "search_chantiers" }],
  },
  {
    question: "Y a-t-il un chantier sur l'accès aux soins ?",
    reason: "thématique proche de plusieurs chantiers santé du monde de base",
    expected: [{ toolName: "search_chantiers" }],
  },
  {
    question:
      "Donne-moi les indicateurs du chantier CH-004 pour la France entière",
    reason:
      "CAS NÉGATIF : identifiant déjà fourni, le prompt interdit de rechercher",
    expected: [
      { toolName: "get_indicateurs", input: { chantier_id: "CH-004" } },
    ],
  },
];

toolSelectionEval({
  famille: "recherche",
  tool: "search_chantiers",
  cases: CASES,
});
