import type { ToolCase } from "../../types";
import { toolSelectionEval } from "../toolSelectionEval";

/**
 * Niveau 2 — `get_indicateurs`.
 *
 * L'agent appelle l'outil quand l'utilisateur demande les valeurs des
 * indicateurs d'un chantier (VI, VA, VC, TA), ou des informations sur un
 * indicateur. Les questions précisent le territoire, que l'outil exige.
 *
 * Le TA des indicateurs est un positif, le TA du chantier un négatif : la
 * description de l'outil l'écarte explicitement au profit de `get_chantiers`,
 * et l'agent s'y est trompé dans la suite `search_chantiers`.
 *
 * Les autres négatifs portent sur les outils qui parlent aussi d'un indicateur
 * sans en donner les valeurs : l'évolution dans le temps et l'historique des
 * actions. Plusieurs chemins y répondent : seul `get_indicateurs` est interdit.
 */

const CASES: ToolCase[] = [
  {
    question:
      "Quelles sont les valeurs des indicateurs du CH-004 au national ?",
    reason: "valeurs des indicateurs d'un chantier",
    expected: [
      { toolName: "get_indicateurs", input: { chantier_id: "CH-004" } },
    ],
  },
  {
    question:
      "Donne-moi la valeur actuelle et la cible des indicateurs du CH-007 en Bretagne",
    reason: "vocabulaire VA / VC, territoire régional",
    expected: [
      { toolName: "get_indicateurs", input: { chantier_id: "CH-007" } },
    ],
  },
  {
    question:
      "Quel est le taux d'avancement des indicateurs du CH-001 au national ?",
    reason: "TA des indicateurs, à distinguer du TA du chantier",
    expected: [
      { toolName: "get_indicateurs", input: { chantier_id: "CH-001" } },
    ],
  },
  {
    question:
      "Quelles étaient les valeurs des indicateurs du CH-004 au national en 2024 ?",
    reason: "jalon passé transmis",
    expected: [
      {
        toolName: "get_indicateurs",
        input: { chantier_id: "CH-004", jalon: 2024 },
      },
    ],
  },
  {
    question: "Où en est l'indicateur IND-894 au national ?",
    reason: "un seul indicateur : son chantier est à retrouver",
    expected: [{ toolName: "get_indicateurs" }],
  },
  {
    question: "Comment évolue l'IND-004 au national ?",
    reason: "CAS NÉGATIF : évolution dans le temps → get_evolution_indicateur",
    forbidden: ["get_indicateurs"],
  },
  {
    question: "Quel est le taux d'avancement du CH-004 au national ?",
    reason: "CAS NÉGATIF : TA du chantier → get_chantiers",
    forbidden: ["get_indicateurs"],
  },
  {
    question:
      "Quand ont été importées les dernières valeurs de l'IND-004 au national ?",
    reason: "CAS NÉGATIF : historique des actions → get_historique_indicateur",
    forbidden: ["get_indicateurs"],
  },
];

toolSelectionEval({
  famille: "donnees",
  tool: "get_indicateurs",
  cases: CASES,
});
