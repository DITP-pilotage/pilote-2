import type { ToolCase } from "../../types";
import { toolSelectionEval } from "../toolSelectionEval";

/**
 * Niveau 2 — `get_taux_avancement_territoire`.
 *
 * L'agent appelle l'outil pour le taux d'avancement global d'un territoire, sa
 * médiane de répartition et sa position, seul ou en comparaison entre
 * territoires ou entre jalons. Les arguments vérifiés portent l'intention :
 * `include_sous_territoires` et le `jalon`. Le `territoire_code` ne l'est pas :
 * sa résolution relève du niveau 3.
 *
 * Les négatifs portent sur les deux autres taux d'avancement, qui partagent le
 * vocabulaire : celui d'un chantier (`get_chantiers`) et celui de ses
 * indicateurs (`get_indicateurs`).
 */

const CASES: ToolCase[] = [
  {
    question: "Quel est le taux d'avancement de la Bretagne ?",
    reason: "taux global d'un territoire",
    expected: [{ toolName: "get_taux_avancement_territoire" }],
  },
  {
    question: "Quel est le TA de la Normandie ?",
    reason: "acronyme « TA »",
    expected: [{ toolName: "get_taux_avancement_territoire" }],
  },
  {
    question: "Où en est la France sur l'ensemble des chantiers ?",
    reason: "avancement global sans le mot « taux »",
    expected: [{ toolName: "get_taux_avancement_territoire" }],
  },
  {
    question:
      "Comment se situe la Bretagne par rapport à la médiane des régions ?",
    reason: "vocabulaire « médiane » et « position »",
    expected: [{ toolName: "get_taux_avancement_territoire" }],
  },
  {
    question: "Compare le taux d'avancement de la Bretagne et de la Normandie",
    reason: "comparaison entre territoires",
    expected: [{ toolName: "get_taux_avancement_territoire" }],
  },
  {
    question: "Taux d'avancement de la Corse et de ses départements",
    reason: "sous-territoires : un seul appel sur le parent avec le flag",
    expected: [
      {
        toolName: "get_taux_avancement_territoire",
        input: { include_sous_territoires: true },
      },
    ],
  },
  {
    question: "Compare le taux d'avancement de la Bretagne entre 2024 et 2025",
    reason: "comparaison entre jalons : un appel par jalon",
    expected: [
      { toolName: "get_taux_avancement_territoire", input: { jalon: 2024 } },
      { toolName: "get_taux_avancement_territoire", input: { jalon: 2025 } },
    ],
  },
  {
    question: "Quel est le taux d'avancement du CH-004 en Bretagne ?",
    reason: "CAS NÉGATIF : TA d'un chantier → get_chantiers",
    forbidden: ["get_taux_avancement_territoire"],
  },
  {
    question:
      "Quel est le taux d'avancement des indicateurs du CH-004 en Bretagne ?",
    reason: "CAS NÉGATIF : TA des indicateurs → get_indicateurs",
    forbidden: ["get_taux_avancement_territoire"],
  },
];

toolSelectionEval({
  famille: "donnees",
  tool: "get_taux_avancement_territoire",
  cases: CASES,
});
