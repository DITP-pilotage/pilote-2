import type { ToolCase } from "../types";
import { toolSelectionEval } from "./toolSelectionEval";

/**
 * Niveau 2 — `get_chantier_commentaires`.
 *
 * Pas de fixtures de cas : `CH-001`, `CH-004` et `CH-007` portent un
 * commentaire posé par le monde de base.
 *
 * Le cas négatif nomme un territoire : sans lui, l'agent demande une précision
 * — légitimement, `get_indicateurs` en a besoin — et le cas mesure alors la
 * clarification au lieu de la discrimination entre commentaires et
 * indicateurs. Premier jet à 67 % pour cette raison.
 *
 * Référence observée le 2026-09-10 : 100 % isolement, 89 % dans un run enchaine — un essai ou l agent demande une precision au lieu d appeler l outil. Variabilite du modele, pas une regression.
 */

const CASES: ToolCase[] = [
  {
    question: "Quels sont les commentaires les plus récents sur le CH-004 ?",
    reason: "accès aux commentaires par identifiant",
    expected: [
      {
        toolName: "get_chantier_commentaires",
        input: { chantier_id: "CH-004" },
      },
    ],
  },
  {
    question:
      "Quelles difficultés sont remontées dans les commentaires du CH-001 ?",
    reason: "formulation métier : « difficultés remontées » = commentaires",
    expected: [
      {
        toolName: "get_chantier_commentaires",
        input: { chantier_id: "CH-001" },
      },
    ],
  },
  {
    question:
      "Donne-moi les indicateurs du chantier CH-001 pour la France entière",
    reason: "CAS NÉGATIF : les indicateurs relèvent de get_indicateurs",
    expected: [
      { toolName: "get_indicateurs", input: { chantier_id: "CH-001" } },
    ],
  },
];

toolSelectionEval({
  famille: "donnees",
  tool: "get_chantier_commentaires",
  cases: CASES,
});
