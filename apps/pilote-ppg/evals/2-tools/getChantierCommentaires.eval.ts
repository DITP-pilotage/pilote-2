import type { ToolCase } from "../types";
import { toolSelectionEval } from "./toolSelectionEval";

/**
 * Niveau 2 — `get_chantier_commentaires`.
 *
 * L'agent appelle l'outil quand l'utilisateur demande les commentaires d'un
 * chantier. Ils sont de plusieurs types (freins, actions à venir, réussites,
 * décisions stratégiques, commentaires sur les données…) : quand la question
 * en vise un, l'appel doit filtrer sur ce type.
 *
 * Les négatifs portent sur ce qui ressemble à un commentaire sans en être un
 * côté produit : les objectifs (« ce qu'il reste à faire », « ce qui a déjà
 * été fait »), exposés par `get_chantier_objectifs`. Ils forment des paires
 * avec « actions prévues » et « réussites à valoriser », qui sont bien des
 * commentaires.
 *
 * Les décisions stratégiques ont leur propre section sur la page chantier,
 * mais Albert les expose comme un type de commentaire : la question ne dit
 * jamais « commentaire ». Leur restriction aux profils nationaux relève des
 * habilitations, pas de ce niveau.
 *
 * Les questions précisent le territoire, que l'outil exige. Les objectifs ne
 * sont pas territorialisés : les négatifs s'en passent.
 */

const CASES: ToolCase[] = [
  {
    question: "Quels sont les commentaires sur le CH-004 au national ?",
    reason: "demande générique : tous les types, sans filtre",
    expected: [
      {
        toolName: "get_chantier_commentaires",
        input: { chantier_id: "CH-004" },
      },
    ],
  },
  {
    question: "Quels sont les freins à lever sur le CH-004 au national ?",
    reason: "type freins_a_lever",
    expected: [
      {
        toolName: "get_chantier_commentaires",
        input: { chantier_id: "CH-004", types: ["freins_a_lever"] },
      },
    ],
  },
  {
    question: "Quelles actions sont prévues sur le CH-004 au national ?",
    reason: "type actions_a_venir, à ne pas confondre avec l'objectif a_faire",
    expected: [
      {
        toolName: "get_chantier_commentaires",
        input: { chantier_id: "CH-004", types: ["actions_a_venir"] },
      },
    ],
    forbidden: ["get_chantier_objectifs"],
  },
  {
    question: "Quelles réussites sont à valoriser sur le CH-004 au national ?",
    reason:
      "type actions_a_valoriser, à ne pas confondre avec l'objectif deja_fait",
    expected: [
      {
        toolName: "get_chantier_commentaires",
        input: { chantier_id: "CH-004", types: ["actions_a_valoriser"] },
      },
    ],
    forbidden: ["get_chantier_objectifs"],
  },
  {
    question:
      "Comment la Bretagne explique-t-elle ses résultats sur le CH-005 ?",
    reason: "type territorial commentaires_sur_les_donnees",
    expected: [
      {
        toolName: "get_chantier_commentaires",
        input: {
          chantier_id: "CH-005",
          types: ["commentaires_sur_les_donnees"],
        },
      },
    ],
  },
  {
    question: "Qu'a-t-on décidé en réunion Élysée-Matignon sur le CH-004 ?",
    reason: "type decision_strategique, sans le mot « commentaire »",
    expected: [
      {
        toolName: "get_chantier_commentaires",
        input: { chantier_id: "CH-004", types: ["decision_strategique"] },
      },
    ],
  },
  {
    question: "Qu'est-ce qu'il reste à faire sur le CH-004 ?",
    reason: "CAS NÉGATIF : objectif a_faire, pas un commentaire",
    expected: [
      { toolName: "get_chantier_objectifs", input: { chantier_id: "CH-004" } },
    ],
    forbidden: ["get_chantier_commentaires"],
  },
  {
    question: "Qu'est-ce qui a déjà été fait sur le CH-004 ?",
    reason: "CAS NÉGATIF : objectif deja_fait, pas un commentaire",
    expected: [
      { toolName: "get_chantier_objectifs", input: { chantier_id: "CH-004" } },
    ],
    forbidden: ["get_chantier_commentaires"],
  },
];

toolSelectionEval({
  famille: "donnees",
  tool: "get_chantier_commentaires",
  cases: CASES,
});
