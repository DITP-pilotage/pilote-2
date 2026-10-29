import type { ToolCase } from "../../types";
import { toolSelectionEval } from "../toolSelectionEval";

/**
 * Niveau 2 — `get_taux_avancement_territoire`.
 *
 * L'agent appelle l'outil pour le taux d'avancement global d'un territoire, sa
 * médiane de répartition et sa position, seul ou en comparaison entre
 * territoires ou entre jalons. Les arguments vérifiés portent l'intention : le
 * type de `perimetre` et le `jalon`. Les codes des territoires ne le sont
 * pas : leur résolution relève du niveau 3.
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
    question:
      "Comment se situe la Bretagne par rapport à la médiane des régions ?",
    reason: "vocabulaire « médiane » et « position »",
    expected: [{ toolName: "get_taux_avancement_territoire" }],
  },
  {
    question: "Compare le taux d'avancement de la Bretagne et de la Normandie",
    reason: "comparaison entre territoires : une sélection",
    expected: [
      {
        toolName: "get_taux_avancement_territoire",
        input: { perimetre: { type: "SELECTION" } },
      },
    ],
  },
  {
    question: "Bretagne ou Normandie, qui avance le mieux ?",
    reason:
      "« qui avance le mieux » nomme le taux : une sélection, sans encart",
    expected: [
      {
        toolName: "get_taux_avancement_territoire",
        input: { perimetre: { type: "SELECTION" } },
      },
    ],
    forbidden: ["rediger_comparaison_territoires"],
  },
  {
    question: "Taux d'avancement de la Corse et de ses départements",
    reason: "une région et ses départements : un seul appel sur la région",
    expected: [
      {
        toolName: "get_taux_avancement_territoire",
        input: {
          perimetre: {
            type: "REGION_ET_SES_DEPARTEMENTS",
            region_code: "REG-94",
          },
        },
      },
    ],
  },
  {
    question: "Quel est le taux d'avancement des départements bretons ?",
    reason: "« les départements de X » : la région et ses départements",
    expected: [
      {
        toolName: "get_taux_avancement_territoire",
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
    question: "Quel département a le meilleur taux d'avancement ?",
    reason: "tous les départements, sans les énumérer",
    expected: [
      {
        toolName: "get_taux_avancement_territoire",
        input: { perimetre: { type: "TOUS_DEPARTEMENTS" } },
      },
    ],
  },
  {
    question: "Classe les régions selon leur taux d'avancement",
    reason: "toutes les régions, sans les énumérer",
    expected: [
      {
        toolName: "get_taux_avancement_territoire",
        input: { perimetre: { type: "TOUTES_REGIONS" } },
      },
    ],
  },
  {
    question: "Quelles sont les 3 régions qui avancent le moins ?",
    reason: "classement croissant, limité",
    expected: [
      {
        toolName: "get_taux_avancement_territoire",
        input: {
          perimetre: { type: "TOUTES_REGIONS" },
          tri: "taux_croissant",
          limite: 3,
        },
      },
    ],
  },
  {
    question:
      "Quels sont les 5 départements les mieux placés en taux d'avancement ?",
    reason: "classement limité, tous les départements",
    expected: [
      {
        toolName: "get_taux_avancement_territoire",
        input: { perimetre: { type: "TOUS_DEPARTEMENTS" }, limite: 5 },
      },
    ],
  },
  {
    question: "Où en sont la France et ses régions en taux d'avancement ?",
    reason: "le national et ses régions",
    expected: [
      {
        toolName: "get_taux_avancement_territoire",
        input: { perimetre: { type: "FRANCE_ET_SES_REGIONS" } },
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
