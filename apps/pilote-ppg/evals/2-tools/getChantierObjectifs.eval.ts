import type { ToolCase } from "../types";
import { toolSelectionEval } from "./toolSelectionEval";

/**
 * Niveau 2 — `get_chantier_objectifs`.
 *
 * Pas de fixtures de cas : `CH-001`, `CH-004` et `CH-007` portent un objectif
 * de type `notre_ambition` posé par le monde de base.
 *
 * Référence observée le 2026-09-10 : 100 % sur 9 essais.
 */

const CASES: ToolCase[] = [
  {
    question: "Donne-moi les objectifs du chantier CH-004",
    reason: "identifiant explicite, l'argument doit être transmis",
    expected: [
      { toolName: "get_chantier_objectifs", input: { chantier_id: "CH-004" } },
    ],
  },
  {
    question: "Quelle est l'ambition affichée sur le CH-007 ?",
    reason: "formulation métier : « notre ambition » est un type d'objectif",
    expected: [
      { toolName: "get_chantier_objectifs", input: { chantier_id: "CH-007" } },
    ],
  },
  {
    question: "Quels sont les commentaires les plus récents sur le CH-007 ?",
    reason: "CAS NÉGATIF : commentaires, pas objectifs",
    expected: [
      {
        toolName: "get_chantier_commentaires",
        input: { chantier_id: "CH-007" },
      },
    ],
  },
];

toolSelectionEval({
  famille: "donnees",
  tool: "get_chantier_objectifs",
  cases: CASES,
});
