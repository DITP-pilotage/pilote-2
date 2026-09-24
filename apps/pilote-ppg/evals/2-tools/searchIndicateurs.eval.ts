import type { ToolCase } from "../types";
import { toolSelectionEval } from "./toolSelectionEval";

/**
 * Niveau 2 — `search_indicateurs`.
 *
 * L'agent appelle l'outil quand l'utilisateur parle d'un indicateur sans
 * donner son identifiant : soit pour lister des indicateurs, soit pour
 * résoudre un ID avant un autre appel. Connaître le chantier n'est pas requis ;
 * quand il est connu, l'outil doit être restreint à ce chantier.
 *
 * Les négatifs couvrent les trois façons de donner l'ID que le prompt système
 * reconnaît : chantier explicite, IND-XXX explicite, numéro seul à compléter
 * en IND-XXX. Chacun précise le territoire : les outils de données l'exigent,
 * et sans lui l'agent demande une précision au lieu d'appeler un outil.
 */

const CASES: ToolCase[] = [
  {
    question: "Liste tous les indicateurs qui concernent l'éducation nationale",
    reason: "recherche exploratoire par thématique, sans chantier",
    expected: [{ toolName: "search_indicateurs" }],
  },
  {
    question:
      "Quelle est la valeur actuelle de l'indicateur sur la mortalité routière pour NAT-FR ?",
    reason: "indicateur désigné par sa thématique : l'ID est à résoudre",
    expected: [{ toolName: "search_indicateurs" }],
  },
  {
    question: "Dans le chantier CH-018, quel indicateur suit la lecture ?",
    reason: "chantier connu : la recherche doit être restreinte à ce chantier",
    expected: [
      {
        toolName: "search_indicateurs",
        input: { chantier_ids: ["CH-018"] },
      },
    ],
  },
  {
    question: "Quels sont les indicateurs du CH-018 au national ?",
    reason: "CAS NÉGATIF : chantier explicite, ses indicateurs sans recherche",
    expected: [
      { toolName: "get_indicateurs", input: { chantier_id: "CH-018" } },
    ],
    forbidden: ["search_indicateurs"],
  },
  {
    question: "Comment évolue l'IND-894 au national ?",
    reason: "CAS NÉGATIF : IND-XXX explicite, rien à rechercher",
    expected: [
      {
        toolName: "get_evolution_indicateur",
        input: { indicateur_id: "IND-894" },
      },
    ],
    forbidden: ["search_indicateurs"],
  },
  {
    question: "Donne-moi l'historique de l'indicateur 894 au national",
    reason: "CAS NÉGATIF : numéro seul, à compléter en IND-894 sans rechercher",
    expected: [
      {
        toolName: "get_historique_indicateur",
        input: { indicateur_id: "IND-894" },
      },
    ],
    forbidden: ["search_indicateurs"],
  },
];

toolSelectionEval({
  famille: "recherche",
  tool: "search_indicateurs",
  cases: CASES,
});
