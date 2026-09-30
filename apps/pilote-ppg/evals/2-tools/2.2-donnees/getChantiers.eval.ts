import type { ToolCase } from "../../types";
import { toolSelectionEval } from "../toolSelectionEval";

/**
 * Niveau 2 — `get_chantiers`.
 *
 * L'agent appelle l'outil pour lister et restituer les chantiers d'un
 * territoire, les filtrer ou les comparer avec les sous-territoires. Les
 * arguments vérifiés sont ceux qui portent l'intention : la `view`, les
 * filtres, `include_sous_territoires`, les `chantier_ids`. Le `territoire_code`
 * ne l'est pas : résoudre « l'Auvergne » relève de la recherche de territoire
 * et du niveau 3.
 *
 * Les `view` attendues viennent de la table « Comprendre les demandes
 * utilisateur » du prompt système : « en retard » → en_retard seul, « où ça
 * coince » → les deux.
 *
 * Les négatifs portent sur les deux outils voisins : le taux global d'un
 * territoire (`get_taux_avancement_territoire`), et les chantiers signalés sans
 * catégorie, que le prompt système réserve à `get_chantiers_signales`.
 */

const CASES: ToolCase[] = [
  {
    question: "Quels chantiers sur la Bretagne ?",
    reason: "liste des chantiers d'un territoire",
    expected: [{ toolName: "get_chantiers" }],
  },
  {
    question: "Récap des chantiers sur l'Auvergne",
    reason: "« récap » n'est pas un mot-clé de synthèse : pas de gabarit",
    expected: [{ toolName: "get_chantiers" }],
  },
  {
    question: "Compare les chantiers de la Corse et ses départements",
    reason: "sous-territoires : un seul appel sur le parent avec le flag",
    expected: [
      { toolName: "get_chantiers", input: { include_sous_territoires: true } },
    ],
  },
  {
    question: "Quels chantiers en retard sur la Corse ?",
    reason: "« en retard » → view en_retard",
    expected: [{ toolName: "get_chantiers", input: { view: "en_retard" } }],
  },
  {
    question: "Quels PPG en retard en Corse ?",
    reason: "vocabulaire « PPG », synonyme de chantier",
    expected: [{ toolName: "get_chantiers", input: { view: "en_retard" } }],
  },
  {
    question: "En Bretagne, où ça coince ?",
    reason: "« où ça coince » → les deux views, contrat explicite du prompt",
    expected: [
      { toolName: "get_chantiers", input: { view: "en_retard" } },
      { toolName: "get_chantiers", input: { view: "en_difficulte" } },
    ],
  },
  {
    question: "Quels chantiers sont en baisse en Bretagne ?",
    reason: "« en baisse » → filtre tendance BAISSE",
    expected: [{ toolName: "get_chantiers", input: { tendance: "BAISSE" } }],
  },
  {
    question: "Où en est le CH-005 en Bretagne ?",
    reason: "chantier explicite → chantier_ids",
    expected: [
      { toolName: "get_chantiers", input: { chantier_ids: ["CH-005"] } },
    ],
  },
  {
    question: "Quel est le taux d'avancement de la Bretagne ?",
    reason:
      "CAS NÉGATIF : taux global du territoire, pas le détail par chantier",
    forbidden: ["get_chantiers"],
  },
  {
    question: "Quels sont les chantiers signalés en Bretagne ?",
    reason:
      "CAS NÉGATIF : signalements sans catégorie → get_chantiers_signales",
    forbidden: ["get_chantiers"],
  },
];

toolSelectionEval({
  famille: "donnees",
  tool: "get_chantiers",
  cases: CASES,
});
