import type { ToolCase } from "../types";
import { toolSelectionEval } from "./toolSelectionEval";

/**
 * Niveau 2 — `get_taux_avancement_territoire`.
 *
 * Pas de fixtures de cas : l'outil est interrogé sur des territoires du
 * référentiel, chargé dans la base de test par `prisma db seed`.
 *
 * Référence observée le 2026-09-10 : 100 % sur 12 essais. Les trois formulations territoriales et le cas negatif tiennent.
 */

const CASES: ToolCase[] = [
  {
    question: "Quel est le taux d'avancement de la région Bretagne ?",
    reason: "question territoriale directe, territoire nommé",
    expected: [{ toolName: "get_taux_avancement_territoire" }],
  },
  {
    question: "Où en est la France sur l'ensemble des chantiers ?",
    reason: "« la France » doit se résoudre en NAT-FR sans clarification",
    expected: [{ toolName: "get_taux_avancement_territoire" }],
  },
  {
    question: "Compare les taux d'avancement de la Bretagne et de la Normandie",
    reason: "comparaison entre deux territoires, toujours le même outil",
    expected: [{ toolName: "get_taux_avancement_territoire" }],
  },
  {
    question: "Donne-moi les commentaires du chantier CH-004",
    reason: "CAS NÉGATIF : détail d'un chantier, pas de taux territorial",
    expected: [
      {
        toolName: "get_chantier_commentaires",
        input: { chantier_id: "CH-004" },
      },
    ],
  },
];

toolSelectionEval({
  famille: "donnees",
  tool: "get_taux_avancement_territoire",
  cases: CASES,
});
