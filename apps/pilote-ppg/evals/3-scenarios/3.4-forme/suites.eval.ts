import { scenarioEval } from "../scenarioEval";
import { seedCentreAide } from "../../seedCentreAide";
import { SUITES_CRITERIA } from "./suites.criteria";

/**
 * Scénario « Suites proposées » (PIL-1950). Le modèle choisit lui-même la
 * suite d'une réponse, à partir du prompt et de ses outils : le cas mesure
 * qu'elle reste utile, réalisable et nouvelle d'une réponse à l'autre, et
 * qu'il ne l'exécute pas d'office.
 *
 * Chaque réponse de données a ici un prolongement évident. L'exécution
 * d'office se lit dans « Outils attendus » : la suite attendue est un outil
 * interdit du tour. Le centre d'aide, lui, ne se prolonge pas.
 *
 * Référence observée le 2026-11-05, sur 30 essais menés à terme : suites
 * 107/108 (une réponse en propose trois), centre d'aide sans suite 3/3.
 * L'historique des actions sur les valeurs n'est jamais proposé : l'agent
 * préfère l'évolution de l'indicateur ou les chantiers du territoire.
 */

const BRETAGNE = { type: "SELECTION", territoire_codes: ["REG-53"] };

const QUESTION_TAUX = "Quel est le taux d'avancement de la Bretagne ?";

scenarioEval({
  suite: "Suites proposées",
  group: "forme",
  seedSupplementaire: seedCentreAide,
  criteria: SUITES_CRITERIA,
  cases: [
    {
      question: QUESTION_TAUX,
      reason: "taux d'un territoire : ses chantiers en retard ou en difficulté",
      truthScope: { territoires: ["REG-53"] },
      expected: [
        {
          toolName: "get_taux_avancement_territoire",
          input: { perimetre: BRETAGNE },
        },
      ],
      forbidden: ["get_chantiers"],
    },
    {
      question: "Quels sont les chantiers en retard en Bretagne ?",
      reason:
        "liste de chantiers : leurs commentaires, leurs indicateurs, ou la même liste ailleurs",
      truthScope: { territoires: ["REG-53"] },
      expected: [
        {
          toolName: "get_chantiers",
          input: { perimetre: BRETAGNE, view: "en_retard" },
        },
      ],
      forbidden: ["get_chantier_commentaires"],
    },
    {
      question:
        "Quelles sont les valeurs des indicateurs du CH-005 en Bretagne ?",
      reason:
        "valeurs d'un indicateur : sa courbe, ou l'historique des actions sur ses valeurs",
      truthScope: { territoires: ["REG-53"], indicateurs: true },
      expected: [
        {
          toolName: "get_indicateurs",
          input: { chantier_id: "CH-005", territoire_code: "REG-53" },
        },
      ],
      forbidden: ["get_evolution_indicateur", "get_historique_indicateur"],
    },
    {
      question: "Et quels chantiers y sont en retard ?",
      history: [QUESTION_TAUX],
      reason:
        "PIÈGE : la suite du premier tour est servie, le taux et les retards ne se reproposent pas",
      truthScope: { territoires: ["REG-53"] },
      // « y » se lit sur la région seule ou avec ses départements : le cas
      // mesure la suite, pas la lecture du périmètre.
      expected: [{ toolName: "get_chantiers", input: { view: "en_retard" } }],
    },
    {
      question: "Comment est calculé le taux d'avancement d'un chantier ?",
      reason: "CAS NÉGATIF : une page du centre d'aide, sans suite",
      truthScope: { territoires: ["REG-53"] },
      expected: [{ toolName: "consulter_centre_aide" }],
    },
  ],
});
