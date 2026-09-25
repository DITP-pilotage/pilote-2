import type { ToolCase } from "../types";
import { toolSelectionEval } from "./toolSelectionEval";

/**
 * Niveau 2 — `get_chantiers_signales`.
 *
 * Le prompt système distingue deux régimes : sans précision de catégorie,
 * l'outil est appelé sans `categories` ; avec une ou plusieurs catégories
 * nommées, elles sont passées explicitement.
 *
 * Ces cas n'expriment volontairement pas d'attente sur `categories` : les
 * valeurs exactes de l'énumération n'ont pas été relevées dans le code, et un
 * cas qui n'exprime rien vaut mieux qu'un cas qui exprime une valeur fausse.
 *
 * Référence observée le 2026-09-10 : 100 % sur 12 essais, sans attente sur categories.
 */

const CASES: ToolCase[] = [
  {
    question: "Quels sont les chantiers signalés en Bretagne ?",
    reason: "sans précision de catégorie → appel sans argument categories",
    expected: [{ toolName: "get_chantiers_signales" }],
  },
  {
    question: "En Bretagne, quels chantiers ont un taux non calculé ?",
    reason: "une seule catégorie nommée",
    expected: [{ toolName: "get_chantiers_signales" }],
  },
  {
    question:
      "En Bretagne, montre-moi les signalements de type PVA et météo non renseignée",
    reason: "deux catégories demandées ensemble",
    expected: [{ toolName: "get_chantiers_signales" }],
  },
  {
    question: "Quels chantiers sont en retard en Bretagne ?",
    reason:
      "CAS NÉGATIF : « en retard » relève de get_chantiers, pas des signalements",
    expected: [{ toolName: "get_chantiers", input: { view: "en_retard" } }],
  },
];

toolSelectionEval({
  famille: "donnees",
  tool: "get_chantiers_signales",
  cases: CASES,
});
