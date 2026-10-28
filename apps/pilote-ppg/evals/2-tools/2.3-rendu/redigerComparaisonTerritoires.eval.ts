import type { ToolCase } from "../../types";
import { toolSelectionEval } from "../toolSelectionEval";

/**
 * Niveau 2 — `rediger_comparaison_territoires` (PIL-1900, étape 4).
 *
 * Une comparaison générique de territoires ouvre l'encart : des territoires
 * désignés, ou un territoire et ses sous-territoires quand la demande dit
 * « compare » ou « synthèse ». Les demandes précises sont dans la suite de
 * `rediger_synthese_territoire`.
 */

const CASES: ToolCase[] = [
  {
    question: "Compare le Nord et la Gironde",
    reason: "deux territoires désignés",
    expected: [{ toolName: "rediger_comparaison_territoires" }],
  },
  {
    question: "Bretagne ou Normandie, qui avance le mieux ?",
    reason: "comparaison sans le mot « compare »",
    expected: [{ toolName: "rediger_comparaison_territoires" }],
  },
  {
    question: "Compare la Bretagne avec ses départements",
    reason: "« compare » un territoire et ses sous-territoires",
    expected: [
      {
        toolName: "rediger_comparaison_territoires",
        input: { territoire_code: "REG-53", include_sous_territoires: true },
      },
    ],
  },
  {
    question: "Compare les chantiers de la Corse et ses départements",
    reason: "« compare » les chantiers d'un territoire et de ses départements",
    expected: [
      {
        toolName: "rediger_comparaison_territoires",
        input: { include_sous_territoires: true },
      },
    ],
  },
];

toolSelectionEval({
  famille: "rendu",
  tool: "rediger_comparaison_territoires",
  cases: CASES,
});
