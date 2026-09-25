import type { ToolCase } from "../types";
import { toolSelectionEval } from "./toolSelectionEval";

/**
 * Niveau 2 — `get_indicateurs`.
 *
 * Pas de fixtures de cas : `CH-001`, `CH-004` et `CH-007` sont dotés d'un
 * indicateur par le monde de base.
 *
 * Toutes les questions nomment un territoire. Sans lui, l'agent demande une
 * précision — légitimement, `get_indicateurs` en a besoin — et le cas mesure
 * alors la clarification au lieu de la résolution d'identifiant. Premier
 * jet à 89 % pour cette raison.
 *
 * Référence observée le 2026-09-10 : 100 % sur 9 essais, une fois le territoire ajoute aux questions.
 */

const CASES: ToolCase[] = [
  {
    question:
      "Donne-moi les indicateurs du chantier CH-004 pour la France entière",
    reason: "identifiant et territoire explicites",
    expected: [
      { toolName: "get_indicateurs", input: { chantier_id: "CH-004" } },
    ],
  },
  {
    question:
      "Quelles sont les valeurs des indicateurs de CH-007 pour la France entière ?",
    reason: "identifiant sans le mot « chantier », toujours résoluble",
    expected: [
      { toolName: "get_indicateurs", input: { chantier_id: "CH-007" } },
    ],
  },
  {
    question: "Donne-moi les objectifs du chantier CH-004",
    reason: "CAS NÉGATIF : objectifs et indicateurs sont deux outils distincts",
    expected: [
      { toolName: "get_chantier_objectifs", input: { chantier_id: "CH-004" } },
    ],
  },
];

toolSelectionEval({
  famille: "donnees",
  tool: "get_indicateurs",
  cases: CASES,
});
