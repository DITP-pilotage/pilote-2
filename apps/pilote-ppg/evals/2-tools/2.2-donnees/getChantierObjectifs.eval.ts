import type { ToolCase } from "../../types";
import { toolSelectionEval } from "../toolSelectionEval";

/**
 * Niveau 2 — `get_chantier_objectifs`.
 *
 * L'agent appelle l'outil quand l'utilisateur demande l'ambition, les
 * objectifs ou la feuille de route d'un chantier, ou ce qu'il reste à faire.
 * Les objectifs sont nationaux et ne dépendent d'aucun territoire : une
 * question posée sur la Bretagne doit quand même y mener.
 *
 * Les négatifs portent sur les cibles des indicateurs (valeur cible, objectif
 * chiffré). Les utilisateurs ne confondent pas, mais le vocabulaire est assez
 * proche pour que l'agent appelle cet outil dans une discussion sur les
 * indicateurs. Plusieurs outils y répondent légitimement : seul l'appel aux
 * objectifs est interdit, sans autre attente.
 *
 * La confusion avec les commentaires (« actions prévues », « réussites à
 * valoriser ») est couverte par la suite `get_chantier_commentaires`.
 */

const CASES: ToolCase[] = [
  {
    question: "Quelle est l'ambition du CH-007 ?",
    reason: "vocabulaire « ambition », type notre_ambition",
    expected: [
      { toolName: "get_chantier_objectifs", input: { chantier_id: "CH-007" } },
    ],
  },
  {
    question: "Quels sont les objectifs du chantier CH-012 ?",
    reason: "vocabulaire « objectifs » appliqué à un chantier",
    expected: [
      { toolName: "get_chantier_objectifs", input: { chantier_id: "CH-012" } },
    ],
  },
  {
    question: "Quelle est la feuille de route du CH-004 ?",
    reason: "vocabulaire « feuille de route »",
    expected: [
      { toolName: "get_chantier_objectifs", input: { chantier_id: "CH-004" } },
    ],
  },
  {
    question: "Qu'est-ce qu'il reste à faire sur le CH-009 ?",
    reason: "vocabulaire du type a_faire",
    expected: [
      { toolName: "get_chantier_objectifs", input: { chantier_id: "CH-009" } },
    ],
  },
  {
    question: "Quelle est l'ambition du CH-004 en Bretagne ?",
    reason:
      "territoire cité : les objectifs sont nationaux, l'outil s'applique",
    expected: [
      { toolName: "get_chantier_objectifs", input: { chantier_id: "CH-004" } },
    ],
  },
  {
    question:
      "Quel est l'objectif chiffré de l'indicateur IND-004 au national ?",
    reason:
      "CAS NÉGATIF : « objectif chiffré » d'un indicateur, pas du chantier",
    forbidden: ["get_chantier_objectifs"],
  },
  {
    question:
      "Quelle est la valeur cible de l'indicateur IND-009 au national ?",
    reason: "CAS NÉGATIF : « valeur cible » d'un indicateur",
    forbidden: ["get_chantier_objectifs"],
  },
  {
    question: "Quel est l'objectif cible de l'indicateur IND-012 au national ?",
    reason: "CAS NÉGATIF : « objectif cible » d'un indicateur",
    forbidden: ["get_chantier_objectifs"],
  },
  {
    question:
      "Les indicateurs du CH-004 atteignent-ils leurs objectifs au national ?",
    reason: "CAS NÉGATIF : « objectifs » des indicateurs, pas du chantier",
    forbidden: ["get_chantier_objectifs"],
  },
];

toolSelectionEval({
  famille: "donnees",
  tool: "get_chantier_objectifs",
  cases: CASES,
});
