import type { ToolCase } from "../types";
import { toolSelectionEval } from "./toolSelectionEval";

/**
 * Niveau 2 — `get_chantiers`.
 *
 * Les `view` attendues viennent de la table « Comprendre les demandes
 * utilisateur » du prompt système : « en retard » → en_retard seul, « qui ont
 * besoin d'aide » → en_difficulte seul, « où ça coince » → les deux.
 *
 * Les cas visent la BRETAGNE et non le national : `get_chantiers(NAT-FR,
 * en_retard)` renvoie `non_applicable`, l'écart à la médiane supposant des
 * territoires comparables.
 *
 * Référence observée le 2026-09-10 : 100 % sur 12 essais, en 30 s.
 *
 * Les trois contrats de `view` tiennent, cas négatif compris. Les réponses
 * nomment bien le chantier semé et son écart de -15 points : la donnée circule,
 * ce n'est pas un vert obtenu sur un outil qui renverrait vide.
 *
 * Variabilité observée sans effet sur le score : l'agent passe tantôt par
 * `search_territoires` pour résoudre « Bretagne », tantôt directement par
 * `get_chantiers`.
 */

const CASES: ToolCase[] = [
  {
    question: "Quels chantiers sont en retard en Bretagne ?",
    reason: "« en retard » → view en_retard uniquement",
    expected: [{ toolName: "get_chantiers", input: { view: "en_retard" } }],
  },
  {
    question: "Quels chantiers ont besoin d'un appui en Bretagne ?",
    reason: "« qui ont besoin d'aide » → view en_difficulte uniquement",
    expected: [{ toolName: "get_chantiers", input: { view: "en_difficulte" } }],
  },
  {
    question: "En Bretagne, où ça coince ?",
    reason: "« où ça coince » → les DEUX views, contrat explicite du prompt",
    expected: [
      { toolName: "get_chantiers", input: { view: "en_retard" } },
      { toolName: "get_chantiers", input: { view: "en_difficulte" } },
    ],
  },
  {
    question: "Quel est le taux d'avancement de la Bretagne ?",
    reason: "CAS NÉGATIF : taux global, pas de liste de chantiers",
    expected: [{ toolName: "get_taux_avancement_territoire" }],
  },
];

toolSelectionEval({
  famille: "donnees",
  tool: "get_chantiers",
  cases: CASES,
});
