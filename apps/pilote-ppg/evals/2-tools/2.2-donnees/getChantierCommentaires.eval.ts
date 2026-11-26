import { fixtures } from "@/test/fixtures";
import type { ToolCase } from "../../types";
import { toolSelectionEval } from "../toolSelectionEval";

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
 * Les commentaires des territoires où un chantier est en difficulté :
 * `get_chantiers` trouve les territoires, puis `get_chantier_commentaires` lit
 * leurs commentaires. `get_chantiers` n'en porte aucun, pas même la synthèse
 * des résultats : l'agent s'en contentait et disait « sans commentaire » un
 * territoire qui n'avait pas de synthèse. La suite sème donc une synthèse pour
 * CH-006 en Bretagne : sans elle, l'agent n'a rien dont se contenter et le
 * défaut ne se reproduit pas.
 *
 * Les questions précisent le territoire, que l'outil exige. Les objectifs ne
 * sont pas territorialisés : les négatifs s'en passent.
 */

const CASES: ToolCase[] = [
  {
    question: "Qui a rédigé les commentaires du CH-004 au national ?",
    reason: "l'auteur d'un commentaire est porté par le commentaire (PIL-1860)",
    expected: [
      {
        toolName: "get_chantier_commentaires",
        input: { chantier_id: "CH-004" },
      },
    ],
  },
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
    question:
      "Fais-moi la synthèse des commentaires du CH-006 pour chaque région où il est en difficulté. Mets en évidence les sujets récurrents.",
    reason:
      "demande de recette : les régions en difficulté, puis tous leurs commentaires, pas la seule synthèse des résultats",
    expected: [
      {
        toolName: "get_chantiers",
        input: { view: "en_difficulte", chantier_ids: ["CH-006"] },
      },
      {
        toolName: "get_chantier_commentaires",
        input: { chantier_id: "CH-006" },
      },
    ],
  },
  {
    question:
      "Que disent les commentaires du CH-006 dans les régions où il est en difficulté ? Quels sujets reviennent ?",
    reason: "même demande autrement formulée",
    expected: [
      {
        toolName: "get_chantiers",
        input: { view: "en_difficulte", chantier_ids: ["CH-006"] },
      },
      {
        toolName: "get_chantier_commentaires",
        input: { chantier_id: "CH-006" },
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

// Même date de saisie que le monde territorial : une date du jour rendrait les
// réponses différentes d'un run à l'autre.
const DATE_SAISIE = new Date("2026-09-15T10:00:00Z");

async function seedSyntheseCH006Bretagne() {
  await fixtures.syntheseDesResultats({
    chantier_id: "CH-006",
    territoire_code: "REG-53",
    maille: "REG",
    code_insee: "53",
    meteo: "ORAGE",
    commentaire:
      "Les recrutements de médecins prennent du retard : trois postes restent vacants. Le déploiement des maisons de santé est décalé au second semestre.",
    date_creation: DATE_SAISIE,
    date_modification: DATE_SAISIE,
  });
}

toolSelectionEval({
  famille: "donnees",
  tool: "get_chantier_commentaires",
  cases: CASES,
  seedSupplementaire: seedSyntheseCH006Bretagne,
});
