import type { ToolCase } from "../../types";
import { toolSelectionEval } from "../toolSelectionEval";

/**
 * Niveau 2 — `get_evolution_indicateur`.
 *
 * L'agent appelle l'outil quand l'utilisateur demande comment évolue un
 * indicateur dans le temps : tendance, progression. Les questions précisent le
 * territoire, que l'outil exige.
 *
 * Les négatifs portent sur les voisins : la valeur ponctuelle
 * (`get_indicateurs`), l'évolution d'un chantier et non d'un indicateur, et
 * l'historique des actions (`get_historique_indicateur`). Pas de négatif sur
 * « trace la courbe » : pour composer le dashboard, l'agent peut légitimement
 * récupérer l'évolution avant d'appeler `create_dashboard`.
 */

const CASES: ToolCase[] = [
  {
    question: "Comment évolue l'IND-004 au national ?",
    reason: "« comment évolue » un indicateur explicite",
    expected: [
      {
        toolName: "get_evolution_indicateur",
        input: { indicateur_id: "IND-004" },
      },
    ],
  },
  {
    question: "Quelle est la tendance de l'indicateur IND-009 en Bretagne ?",
    reason: "vocabulaire « tendance », territoire régional",
    expected: [
      {
        toolName: "get_evolution_indicateur",
        input: { indicateur_id: "IND-009" },
      },
    ],
  },
  {
    question: "Est-ce que l'IND-012 progresse au national ?",
    reason: "vocabulaire « progresse »",
    expected: [
      {
        toolName: "get_evolution_indicateur",
        input: { indicateur_id: "IND-012" },
      },
    ],
  },
  {
    question:
      "Comment a évolué l'indicateur sur la mortalité routière au national ?",
    reason: "indicateur désigné par sa thématique : à retrouver d'abord",
    expected: [{ toolName: "get_evolution_indicateur" }],
  },
  {
    question: "Quelle est la valeur actuelle de l'IND-004 au national ?",
    reason: "CAS NÉGATIF : valeur ponctuelle → get_indicateurs",
    forbidden: ["get_evolution_indicateur"],
  },
  {
    question: "Comment évolue le taux d'avancement du CH-004 en Bretagne ?",
    reason: "CAS NÉGATIF : évolution d'un chantier, pas d'un indicateur",
    forbidden: ["get_evolution_indicateur"],
  },
  {
    question:
      "Quand ont été importées les dernières valeurs de l'IND-004 au national ?",
    reason: "CAS NÉGATIF : historique des actions → get_historique_indicateur",
    forbidden: ["get_evolution_indicateur"],
  },
];

toolSelectionEval({
  famille: "donnees",
  tool: "get_evolution_indicateur",
  cases: CASES,
});
