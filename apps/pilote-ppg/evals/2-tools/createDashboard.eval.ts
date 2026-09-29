import type { ToolCase } from "../types";
import { toolSelectionEval } from "./toolSelectionEval";

/**
 * Niveau 2 — `create_dashboard`.
 *
 * L'outil n'est exposé que si le détecteur d'intention repère un mot-clé :
 * un négatif sans mot-clé ne testerait rien, l'agent ne verrait même pas
 * l'outil. Les négatifs contiennent donc un mot-clé du détecteur (« montre »,
 * « affiche », « visualise ») sans demande de dashboard : côté produit, il faut
 * le demander explicitement (tableau de bord, dashboard, cartographie, courbe,
 * graphique).
 *
 * L'agent récupère souvent des données avant l'appel, pour résoudre les
 * identifiants à passer au dashboard. Seul l'appel à `create_dashboard` est
 * vérifié ici ; l'enchaînement relève du niveau 3.
 */

const CASES: ToolCase[] = [
  {
    question:
      "Compose un tableau de bord de la Bretagne avec le taux d'avancement et les chantiers en retard",
    reason: "« tableau de bord » explicite",
    expected: [{ toolName: "create_dashboard" }],
  },
  {
    question: "Fais-moi un dashboard des chantiers santé en Bretagne",
    reason: "« dashboard » explicite",
    expected: [{ toolName: "create_dashboard" }],
  },
  {
    question: "Je veux la cartographie du taux d'avancement par région",
    reason: "« cartographie » : rendu visuel explicite",
    expected: [{ toolName: "create_dashboard" }],
  },
  {
    question: "Trace la courbe d'évolution de l'IND-004 au national",
    reason: "« courbe » : graphique explicite",
    expected: [{ toolName: "create_dashboard" }],
  },
  {
    question: "Montre-moi les chantiers en retard en Bretagne",
    reason: "CAS NÉGATIF : « montre » expose l'outil, mais c'est une liste",
    forbidden: ["create_dashboard"],
  },
  {
    question: "Affiche les commentaires du CH-004 au national",
    reason: "CAS NÉGATIF : « affiche » expose l'outil, mais c'est une lecture",
    forbidden: ["create_dashboard"],
  },
  {
    question:
      "Je visualise mal où en est le CH-004 en Bretagne, tu peux m'expliquer ?",
    reason:
      "CAS NÉGATIF : « visualise » expose l'outil, on demande une explication",
    forbidden: ["create_dashboard"],
  },
];

toolSelectionEval({
  famille: "rendu",
  tool: "create_dashboard",
  cases: CASES,
});
