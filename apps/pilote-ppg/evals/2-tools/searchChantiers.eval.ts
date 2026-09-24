import type { ToolCase } from "../types";
import { toolSelectionEval } from "./toolSelectionEval";

/**
 * Niveau 2 — `search_chantiers`.
 *
 * L'agent appelle l'outil quand l'utilisateur parle d'un chantier sans donner
 * son identifiant : soit pour lister des chantiers, soit pour résoudre un ID
 * avant un autre appel. Seul l'appel de `search_chantiers` est vérifié ici ;
 * l'enchaînement relève du niveau 3.
 *
 * Les cas « écologie » ne font varier que le mot qui désigne le chantier
 * (chantier, PPG, politique) : si l'un décroche, c'est le vocabulaire qui est
 * en cause, pas la thématique. « Écologie » n'apparaît dans aucun nom de
 * chantier du monde de base.
 */

const CASES: ToolCase[] = [
  {
    question:
      "Quel est le taux d'avancement du chantier sur les violences sexistes sur le territoire DEPT-84 ?",
    reason: "chantier désigné par sa thématique : l'ID est à résoudre",
    expected: [{ toolName: "search_chantiers" }],
  },
  {
    question: "Quels chantiers sur l'écologie ?",
    reason: "recherche exploratoire, thématique absente des noms",
    expected: [{ toolName: "search_chantiers" }],
  },
  {
    question: "Quelle PPG sur l'écologie ?",
    reason: "vocabulaire « PPG », synonyme de chantier pour le prompt système",
    expected: [{ toolName: "search_chantiers" }],
  },
  {
    question: "Quelle politique sur l'écologie ?",
    reason: "vocabulaire « politique »",
    expected: [{ toolName: "search_chantiers" }],
  },
  {
    question:
      "Quel est le taux d'avancement du CH-001 sur le territoire DEPT-84 ?",
    reason: "CAS NÉGATIF : ID explicite, rien à rechercher",
    expected: [{ toolName: "get_chantiers" }],
    forbidden: ["search_chantiers"],
  },
  {
    question: "Quel indicateur mesure les émissions de CO₂ ?",
    reason:
      "thématique d'indicateur : search_chantiers toléré pour scoper la recherche",
    expected: [{ toolName: "search_indicateurs" }],
  },
  {
    question: "Quels chantiers sont en retard dans le Finistère ?",
    reason: "CAS NÉGATIF : « chantiers » sans thématique, rien à rechercher",
    expected: [{ toolName: "get_chantiers", input: { view: "en_retard" } }],
    forbidden: ["search_chantiers"],
  },
];

toolSelectionEval({
  famille: "recherche",
  tool: "search_chantiers",
  cases: CASES,
});
