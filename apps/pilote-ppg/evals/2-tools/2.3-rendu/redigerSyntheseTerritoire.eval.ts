import type { ToolCase } from "../../types";
import { toolSelectionEval } from "../toolSelectionEval";
import { DEMANDES_PRECISES } from "./demandesPrecises";

/**
 * Niveau 2 — `rediger_synthese_territoire` (PIL-1900, étape 4).
 *
 * Une synthèse ou un état des lieux générique d'un territoire ouvre l'encart ;
 * une demande précise reste une réponse dans le fil (`DEMANDES_PRECISES`).
 */

const CASES: ToolCase[] = [
  {
    question: "Fais-moi la synthèse du Nord",
    reason: "synthèse explicite",
    expected: [{ toolName: "rediger_synthese_territoire" }],
  },
  {
    question: "Où en est la Gironde ?",
    reason: "état des lieux générique d'un territoire",
    expected: [{ toolName: "rediger_synthese_territoire" }],
  },
  {
    question: "La situation en Bretagne",
    reason: "« la situation » d'un territoire",
    expected: [{ toolName: "rediger_synthese_territoire" }],
  },
  {
    question: "Fais-moi la synthèse des difficultés de la Bretagne",
    reason: "« synthèse » l'emporte sur « les difficultés »",
    expected: [{ toolName: "rediger_synthese_territoire" }],
  },
  {
    question: "Où en est la France sur l'ensemble des chantiers ?",
    reason: "état des lieux national",
    expected: [
      {
        toolName: "rediger_synthese_territoire",
        input: { territoire_code: "NAT-FR" },
      },
    ],
  },
  ...DEMANDES_PRECISES,
];

toolSelectionEval({
  famille: "rendu",
  tool: "rediger_synthese_territoire",
  cases: CASES,
});
