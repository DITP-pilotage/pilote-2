import type { ToolCase } from "../../types";
import { toolSelectionEval } from "../toolSelectionEval";

/**
 * Niveau 2 — `rediger_comparaison_territoires` (PIL-1900, étape 4).
 *
 * Une comparaison générique de territoires ouvre l'encart : des territoires
 * désignés, une région et ses départements ou la France et ses régions quand
 * la demande dit
 * « compare » ou « synthèse ». Les demandes précises sont dans la suite de
 * `rediger_synthese_territoire`.
 */

const CASES: ToolCase[] = [
  {
    question: "Compare le Nord et la Gironde",
    reason: "deux territoires désignés",
    expected: [
      {
        toolName: "rediger_comparaison_territoires",
        input: { perimetre: { type: "SELECTION" } },
      },
    ],
  },
  {
    question: "Fais-moi la comparaison de la Bretagne et de la Normandie",
    reason: "comparaison générique sans le verbe « compare »",
    expected: [{ toolName: "rediger_comparaison_territoires" }],
  },
  {
    question: "Compare la Bretagne avec ses départements",
    reason: "« compare » un territoire et ses sous-territoires",
    expected: [
      {
        toolName: "rediger_comparaison_territoires",
        input: {
          perimetre: {
            type: "REGION_ET_SES_DEPARTEMENTS",
            region_code: "REG-53",
          },
        },
      },
    ],
  },
  {
    question: "Compare les chantiers de la Corse et ses départements",
    reason: "« compare » les chantiers d'un territoire et de ses départements",
    expected: [
      {
        toolName: "rediger_comparaison_territoires",
        input: { perimetre: { type: "REGION_ET_SES_DEPARTEMENTS" } },
      },
    ],
  },
  {
    question: "Compare la France et ses régions",
    reason: "« compare » le national et ses régions",
    expected: [
      {
        toolName: "rediger_comparaison_territoires",
        input: { perimetre: { type: "FRANCE_ET_SES_REGIONS" } },
      },
    ],
  },
];

toolSelectionEval({
  famille: "rendu",
  tool: "rediger_comparaison_territoires",
  cases: CASES,
});
