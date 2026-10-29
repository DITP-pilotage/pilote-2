import type { ToolCase } from "../../types";
import { toolSelectionEval } from "../toolSelectionEval";

/**
 * Niveau 2 — `get_chantiers`.
 *
 * L'agent appelle l'outil pour lister et restituer les chantiers d'un
 * ensemble de territoires et les filtrer. Les arguments vérifiés sont ceux qui
 * portent l'intention : la `view`, les filtres, le type de `perimetre`, les
 * `chantier_ids`. Les codes des territoires ne le sont pas : résoudre
 * « l'Auvergne » relève de la recherche de territoire et du niveau 3.
 *
 * Les `view` attendues viennent de la table « Comprendre les demandes
 * utilisateur » du prompt système : « en retard » → en_retard seul, « où ça
 * coince » → les deux.
 *
 * Les négatifs portent sur les deux outils voisins : le taux global d'un
 * territoire (`get_taux_avancement_territoire`), et les chantiers signalés sans
 * catégorie, que le prompt système réserve à `get_chantiers_signales`, et le
 * retard de mise à jour des données, que le prompt système réserve à
 * `get_indicateurs_non_a_jour`.
 */

const CASES: ToolCase[] = [
  {
    question: "Quels chantiers sur la Bretagne ?",
    reason: "liste des chantiers d'un territoire",
    expected: [{ toolName: "get_chantiers" }],
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
    question: "Quels chantiers sont en retard dans les départements bretons ?",
    reason:
      "« les départements de X » : la région et ses départements, en un appel",
    expected: [
      {
        toolName: "get_chantiers",
        input: {
          view: "en_retard",
          perimetre: {
            type: "REGION_ET_SES_DEPARTEMENTS",
            region_code: "REG-53",
          },
        },
      },
    ],
  },
  {
    question: "Quels chantiers sont en difficulté dans toutes les régions ?",
    reason: "toutes les régions, sans les énumérer",
    expected: [
      {
        toolName: "get_chantiers",
        input: {
          view: "en_difficulte",
          perimetre: { type: "TOUTES_REGIONS" },
        },
      },
    ],
  },
  {
    question:
      "Quels chantiers sont les plus en retard dans tous les départements ?",
    reason: "classement par écart, tous les départements",
    expected: [
      {
        toolName: "get_chantiers",
        input: {
          perimetre: { type: "TOUS_DEPARTEMENTS" },
          view: "en_retard",
          tri: "ecart_croissant",
        },
      },
    ],
  },
  {
    question: "Liste les chantiers en difficulté de tous les départements",
    reason: "tous les départements, sans les énumérer",
    expected: [
      {
        toolName: "get_chantiers",
        input: {
          perimetre: { type: "TOUS_DEPARTEMENTS" },
          view: "en_difficulte",
        },
      },
    ],
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
  {
    question: "Quels indicateurs ont un retard de mise à jour en Bretagne ?",
    reason:
      "CAS NÉGATIF : « retard de mise à jour » = fraîcheur → get_indicateurs_non_a_jour, pas view en_retard",
    forbidden: ["get_chantiers"],
  },
];

toolSelectionEval({
  famille: "donnees",
  tool: "get_chantiers",
  cases: CASES,
});
