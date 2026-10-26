import type { ToolCase } from "../../types";
import { toolSelectionEval } from "../toolSelectionEval";

/**
 * Niveau 2 — `synthese_territoire`.
 *
 * Le livrable de synthèse exécute côté serveur ce que le prompt faisait
 * orchestrer au LLM : taux d'avancement, chantiers en retard, chantiers en
 * difficulté. Les cas positifs interdisent les deux primitives : un appel en
 * plus sur le même périmètre est le défaut que le livrable doit supprimer.
 *
 * Les négatifs mesurent la concurrence inverse : une question ciblée (une
 * catégorie, le seul taux, un chantier) ne doit pas déclencher de synthèse.
 */

const PRIMITIVES = ["get_chantiers", "get_taux_avancement_territoire"];

const CASES: ToolCase[] = [
  {
    question: "Fais-moi la synthèse de la Bretagne",
    reason: "mot « synthèse »",
    expected: [{ toolName: "synthese_territoire" }],
    forbidden: PRIMITIVES,
  },
  {
    question: "Donne-moi un état des lieux de la Bretagne",
    reason: "« état des lieux »",
    expected: [{ toolName: "synthese_territoire" }],
    forbidden: PRIMITIVES,
  },
  {
    question: "Résume la situation en Bretagne",
    reason: "« résume »",
    expected: [{ toolName: "synthese_territoire" }],
    forbidden: PRIMITIVES,
  },
  {
    question: "Donne-moi un point complet sur la Bretagne",
    reason: "« point complet »",
    expected: [{ toolName: "synthese_territoire" }],
    forbidden: PRIMITIVES,
  },
  {
    question: "Fais-moi un panorama de la Bretagne",
    reason: "« panorama »",
    expected: [{ toolName: "synthese_territoire" }],
    forbidden: PRIMITIVES,
  },
  {
    question: "Fais-moi la synthèse de la Bretagne et de ses départements",
    reason: "sous-territoires : un seul appel sur le parent avec le flag",
    expected: [
      {
        toolName: "synthese_territoire",
        input: { include_sous_territoires: true },
      },
    ],
    forbidden: PRIMITIVES,
  },
  {
    question: "Quels chantiers en retard en Bretagne ?",
    reason: "CAS NÉGATIF : une seule catégorie → get_chantiers",
    forbidden: ["synthese_territoire"],
  },
  {
    question: "Quel est le taux d'avancement de la Bretagne ?",
    reason: "CAS NÉGATIF : le seul taux → get_taux_avancement_territoire",
    forbidden: ["synthese_territoire"],
  },
  {
    question: "Fais-moi la synthèse du chantier CH-005 en Bretagne",
    reason:
      "CAS NÉGATIF : le mot « synthèse » sur un chantier précis → get_chantiers, suggestion de la page d'accueil",
    forbidden: ["synthese_territoire"],
  },
  {
    question: "Où en est le CH-005 en Bretagne ?",
    reason: "CAS NÉGATIF : un chantier précis → get_chantiers",
    forbidden: ["synthese_territoire"],
  },
];

toolSelectionEval({
  famille: "donnees",
  tool: "synthese_territoire",
  cases: CASES,
});
