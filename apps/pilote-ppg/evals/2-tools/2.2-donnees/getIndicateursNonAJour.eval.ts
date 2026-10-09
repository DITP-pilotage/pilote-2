import type { ToolCase } from "../../types";
import { toolSelectionEval } from "../toolSelectionEval";

/**
 * Niveau 2 — `get_indicateurs_non_a_jour`.
 *
 * Une question par ligne « Répondable » du bilan de la spec
 * (docs/superpowers/specs/2026-10-08-indicateurs-non-a-jour-assistant-design.md).
 * R9 n'a pas de cas : la date de la dernière valeur relève aussi de
 * `get_evolution_indicateur`, les deux chemins sont légitimes.
 *
 * Les arguments vérifiés portent l'intention : `chantier_ids`,
 * `indicateur_ids`, et `territoire_code` uniquement pour NAT-FR (résoudre
 * « la Bretagne » relève du niveau 3).
 *
 * Les négatifs portent sur le mot « retard », qui désigne aussi l'avancement
 * (`get_chantiers`), et sur les valeurs des indicateurs (`get_indicateurs`).
 */

const CASES: ToolCase[] = [
  {
    question:
      "Quels sont les indicateurs avec un retard de mise à jour sur mes chantiers ?",
    reason: "R1 — « mes chantiers » : appel sans argument",
    expected: [{ toolName: "get_indicateurs_non_a_jour" }],
  },
  {
    question: "Combien d'indicateurs ne sont pas à jour sur mes chantiers ?",
    reason: "R2 — total dérivé de R1",
    expected: [{ toolName: "get_indicateurs_non_a_jour" }],
  },
  {
    question: "Sur quels chantiers y a-t-il des indicateurs non à jour ?",
    reason: "R13 — restitution par chantier",
    expected: [{ toolName: "get_indicateurs_non_a_jour" }],
  },
  {
    question:
      "Quels sont les indicateurs non mis à jour sur le chantier CH-018 ?",
    reason: "R3 — chantier explicite",
    expected: [
      {
        toolName: "get_indicateurs_non_a_jour",
        input: { chantier_ids: ["CH-018"] },
      },
    ],
  },
  {
    question:
      "Sur quels territoires les données de l'indicateur IND-894 ne sont pas à jour ?",
    reason: "R4 — indicateur explicite : mode détaillé",
    expected: [
      {
        toolName: "get_indicateurs_non_a_jour",
        input: { indicateur_ids: ["IND-894"] },
      },
    ],
  },
  {
    question: "Où les données de l'indicateur 894 ne sont-elles pas à jour ?",
    reason: "R4 — numéro seul complété en IND-894",
    expected: [
      {
        toolName: "get_indicateurs_non_a_jour",
        input: { indicateur_ids: ["IND-894"] },
      },
    ],
  },
  {
    question:
      "La part des locaux raccordables à la fibre est-elle à jour partout ?",
    reason: "R5 — libellé : search_indicateurs puis l'outil",
    expected: [
      { toolName: "search_indicateurs" },
      {
        toolName: "get_indicateurs_non_a_jour",
        input: { indicateur_ids: ["IND-019"] },
      },
    ],
  },
  {
    question: "Quels indicateurs ne sont pas à jour en Bretagne ?",
    reason: "R6 — territoire précisé",
    expected: [{ toolName: "get_indicateurs_non_a_jour" }],
  },
  {
    question: "Les données du CH-018 sont-elles à jour en Bretagne ?",
    reason: "R7 — chantier et territoire",
    expected: [
      {
        toolName: "get_indicateurs_non_a_jour",
        input: { chantier_ids: ["CH-018"] },
      },
    ],
  },
  {
    question: "Depuis quand l'IND-894 n'est-il pas à jour en Bretagne ?",
    reason: "R8 — date attendue de mise à jour",
    expected: [
      {
        toolName: "get_indicateurs_non_a_jour",
        input: { indicateur_ids: ["IND-894"] },
      },
    ],
  },
  {
    question: "Quels territoires n'ont jamais renseigné l'IND-894 ?",
    reason: "R10 — territoires sans valeur",
    expected: [
      {
        toolName: "get_indicateurs_non_a_jour",
        input: { indicateur_ids: ["IND-894"] },
      },
    ],
  },
  {
    question: "Pourquoi l'IND-894 est-il considéré comme pas à jour ?",
    reason: "R11 — explication par périodicité et délai",
    expected: [
      {
        toolName: "get_indicateurs_non_a_jour",
        input: { indicateur_ids: ["IND-894"] },
      },
    ],
  },
  {
    question: "L'IND-894 est-il à jour au niveau national ?",
    reason: "R12 — national explicite",
    expected: [
      {
        toolName: "get_indicateurs_non_a_jour",
        input: { indicateur_ids: ["IND-894"], territoire_code: "NAT-FR" },
      },
    ],
  },
  {
    question: "Quels chantiers sont en retard en Bretagne ?",
    reason:
      "CAS NÉGATIF : retard d'avancement → get_chantiers(view='en_retard')",
    forbidden: ["get_indicateurs_non_a_jour"],
  },
  {
    question:
      "Quelles sont les valeurs des indicateurs du CH-004 au national ?",
    reason: "CAS NÉGATIF : valeurs des indicateurs → get_indicateurs",
    forbidden: ["get_indicateurs_non_a_jour"],
  },
];

toolSelectionEval({
  famille: "donnees",
  tool: "get_indicateurs_non_a_jour",
  cases: CASES,
});
