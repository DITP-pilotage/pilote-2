import type { ToolCase } from "../types";
import { toolSelectionEval } from "./toolSelectionEval";

/**
 * Niveau 2 — `export_rapport`.
 *
 * L'outil n'est exposé que si le détecteur d'intention repère un mot-clé
 * (export, rapport, télécharger, pdf, markdown). Côté produit, « rapport »
 * désigne un fichier : l'agent doit l'exporter, et respecter le format quand
 * il est demandé.
 *
 * Les négatifs contiennent un mot-clé sans intention d'export : « par
 * rapport à », ou « télécharger » dans une question hors périmètre.
 *
 * Sur une demande directe, le prompt système prévoit un workflow complet
 * (synthèse, indicateurs, export) : seul l'appel à `export_rapport` est vérifié
 * ici ; l'enchaînement relève du niveau 3.
 */

const CASES: ToolCase[] = [
  {
    question: "Exporte-moi un rapport PDF sur la Bretagne",
    reason: "export explicite, format PDF demandé",
    expected: [{ toolName: "export_rapport", input: { format: "pdf" } }],
  },
  {
    question:
      "Crée un rapport de synthèse de la Bretagne incluant le taux d'avancement et les chantiers en retard. Format Markdown",
    reason: "scénario de l'écran d'accueil, format Markdown demandé",
    expected: [{ toolName: "export_rapport", input: { format: "markdown" } }],
  },
  {
    question: "Je voudrais télécharger la situation de la Bretagne",
    reason: "« télécharger » : export sans le mot « rapport »",
    expected: [{ toolName: "export_rapport" }],
  },
  {
    question: "Fais-moi un rapport sur la Bretagne",
    reason: "« rapport » seul : un fichier, pas une synthèse dans le chat",
    expected: [{ toolName: "export_rapport" }],
  },
  {
    question: "Comment se situe la Bretagne par rapport à la médiane ?",
    reason: "CAS NÉGATIF : « par rapport à » expose l'outil sans intention",
    forbidden: ["export_rapport"],
  },
  {
    question:
      "Quels chantiers ont progressé en Bretagne par rapport à l'an dernier ?",
    reason: "CAS NÉGATIF : « par rapport à » dans une comparaison",
    forbidden: ["export_rapport"],
  },
  {
    question: "Comment télécharger les données depuis PILOTE ?",
    reason: "CAS NÉGATIF : « télécharger » dans une question hors périmètre",
    forbidden: ["export_rapport"],
  },
];

toolSelectionEval({
  famille: "rendu",
  tool: "export_rapport",
  cases: CASES,
});
