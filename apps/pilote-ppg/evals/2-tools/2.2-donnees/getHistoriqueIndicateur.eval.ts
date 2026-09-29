import type { ToolCase } from "../../types";
import { toolSelectionEval } from "../toolSelectionEval";

/**
 * Niveau 2 — `get_historique_indicateur`.
 *
 * L'agent appelle l'outil quand l'utilisateur demande l'historique des actions
 * sur un indicateur : imports, modifications, propositions de valeur
 * d'avancement (PVA). Les questions précisent le territoire, que l'outil
 * exige.
 *
 * L'historique ne contient aucune donnée personnelle (ni auteur, ni e-mail) :
 * les questions portent sur le « quand » et le « quoi », jamais sur le « qui ».
 *
 * Le cas PVA suit la description de l'outil (`type_filtre: "PROPOSITIONS"`),
 * que le prompt système contredit en déclarant les PVA indisponibles
 * (PIL-1833, point 16). Observé le 2026-09-29 : 3/3, la description de l'outil
 * l'emporte.
 *
 * Les négatifs portent sur l'évolution de la valeur dans le temps, et sur les
 * chantiers ayant une PVA en attente, qui relèvent des signalements.
 */

const CASES: ToolCase[] = [
  {
    question: "Donne-moi l'historique de l'IND-004 au national",
    reason: "« historique » d'un indicateur explicite",
    expected: [
      {
        toolName: "get_historique_indicateur",
        input: { indicateur_id: "IND-004" },
      },
    ],
  },
  {
    question:
      "Quand ont été importées les dernières valeurs de l'IND-009 en Bretagne ?",
    reason: "date d'un import",
    expected: [
      {
        toolName: "get_historique_indicateur",
        input: { indicateur_id: "IND-009" },
      },
    ],
  },
  {
    question:
      "Quand la valeur de l'IND-012 a-t-elle été modifiée pour la dernière fois au national ?",
    reason: "date d'une modification",
    expected: [
      {
        toolName: "get_historique_indicateur",
        input: { indicateur_id: "IND-012" },
      },
    ],
  },
  {
    question:
      "Qu'est-ce qui a été saisi sur l'IND-004 au national entre janvier et mars 2025 ?",
    reason: "période demandée : date de début transmise",
    expected: [
      {
        toolName: "get_historique_indicateur",
        input: { indicateur_id: "IND-004", date_debut: "2025-01-01" },
      },
    ],
  },
  {
    question:
      "Quelles propositions de valeur ont été faites sur l'IND-004 au national ?",
    reason: "PVA : filtre PROPOSITIONS",
    expected: [
      {
        toolName: "get_historique_indicateur",
        input: { indicateur_id: "IND-004", type_filtre: "PROPOSITIONS" },
      },
    ],
  },
  {
    question: "Comment évolue l'IND-004 au national ?",
    reason: "CAS NÉGATIF : évolution de la valeur → get_evolution_indicateur",
    forbidden: ["get_historique_indicateur"],
  },
  {
    question:
      "Quels chantiers ont une proposition de valeur d'avancement en attente en Bretagne ?",
    reason: "CAS NÉGATIF : chantiers signalés PVA → get_chantiers_signales",
    forbidden: ["get_historique_indicateur"],
  },
];

toolSelectionEval({
  famille: "donnees",
  tool: "get_historique_indicateur",
  cases: CASES,
});
