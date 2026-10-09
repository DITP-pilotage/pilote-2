import type { ToolCase } from "../../types";
import { toolSelectionEval } from "../toolSelectionEval";

/**
 * Niveau 2 — `get_chantiers_signales`.
 *
 * L'agent appelle l'outil quand l'utilisateur demande les chantiers signalés,
 * en alerte ou à surveiller, ou une catégorie de signalement. Quand la
 * question en nomme, l'appel doit filtrer sur ces catégories.
 *
 * « En alerte » désigne les chantiers signalés côté produit. Le prompt système
 * le revendique aussi pour `get_chantiers` (table « Comprendre les demandes
 * utilisateur » : les deux vues en retard et en difficulté) : le cas mesure
 * lequel l'emporte. Contradiction remontée dans PIL-1813.
 *
 * Règle de routage du prompt système : une seule catégorie qui a un équivalent
 * dans `get_chantiers` (retard, baisse) passe par `get_chantiers` ; plusieurs
 * catégories, même avec le retard, passent par cet outil. Les négatifs couvrent
 * les deux équivalents, et « en difficulté » (météo dégradée), qui n'est pas un
 * signalement — contrairement à la météo non renseignée.
 */

const CASES: ToolCase[] = [
  {
    question: "Quels sont les chantiers signalés en Bretagne ?",
    reason: "« signalés » sans catégorie : toutes les catégories applicables",
    expected: [{ toolName: "get_chantiers_signales" }],
  },
  {
    question: "Quels chantiers sont en alerte en Bretagne ?",
    reason: "« en alerte » = signalés côté produit, contredit par le prompt",
    expected: [{ toolName: "get_chantiers_signales" }],
  },
  {
    question: "Quels chantiers sont à surveiller en Bretagne ?",
    reason: "« à surveiller », absent du prompt système",
    expected: [{ toolName: "get_chantiers_signales" }],
  },
  {
    question:
      "En Bretagne, quels chantiers ont un taux d'avancement non calculé ?",
    reason: "une catégorie sans équivalent dans get_chantiers",
    expected: [
      {
        toolName: "get_chantiers_signales",
        input: { categories: ["estEnAlerteTauxAvancementNonCalculé"] },
      },
    ],
  },
  {
    question: "En Bretagne, quels chantiers n'ont pas de météo renseignée ?",
    reason:
      "météo non renseignée : un signalement, à distinguer d'en difficulté",
    expected: [
      {
        toolName: "get_chantiers_signales",
        input: { categories: ["estEnAlerteMétéoNonRenseignée"] },
      },
    ],
  },
  {
    question:
      "Quels chantiers ont une proposition de valeur d'avancement en attente en Bretagne ?",
    reason: "catégorie PVA",
    expected: [
      {
        toolName: "get_chantiers_signales",
        input: {
          categories: ["estEnAlertePossedePropositionsValeurAvancement"],
        },
      },
    ],
  },
  {
    question:
      "En Bretagne, quels chantiers sont en retard ou n'ont pas de météo renseignée ?",
    reason:
      "plusieurs catégories, retard compris : cet outil, pas get_chantiers",
    expected: [
      {
        toolName: "get_chantiers_signales",
        input: {
          categories: ["estEnAlerteÉcart", "estEnAlerteMétéoNonRenseignée"],
        },
      },
    ],
  },
  {
    question: "Quels chantiers sont en retard en Bretagne ?",
    reason: "CAS NÉGATIF : une seule catégorie équivalente → get_chantiers",
    forbidden: ["get_chantiers_signales"],
  },
  {
    question: "Quels chantiers sont en baisse en Bretagne ?",
    reason: "CAS NÉGATIF : une seule catégorie équivalente → get_chantiers",
    forbidden: ["get_chantiers_signales"],
  },
  {
    question: "Quels chantiers sont en difficulté en Bretagne ?",
    reason: "CAS NÉGATIF : météo dégradée, pas un signalement",
    forbidden: ["get_chantiers_signales"],
  },
  {
    question:
      "Quels chantiers ont des indicateurs non mis à jour en Bretagne ?",
    reason:
      "CAS NÉGATIF : pas une catégorie de signalement → get_indicateurs_non_a_jour",
    forbidden: ["get_chantiers_signales"],
  },
];

toolSelectionEval({
  famille: "donnees",
  tool: "get_chantiers_signales",
  cases: CASES,
});
