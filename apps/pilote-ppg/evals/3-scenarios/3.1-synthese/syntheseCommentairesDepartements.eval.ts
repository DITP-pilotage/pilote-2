import { scenarioEval } from "../scenarioEval";
import { SYNTHESE_COMMENTAIRES_DEPARTEMENTS_CRITERIA } from "./syntheseCommentairesDepartements.criteria";

/**
 * Scénario « Synthèse des commentaires d'un chantier par département » :
 * « Fais-moi la synthèse des commentaires du chantier 70 pour chaque
 * département en difficulté. Mets en évidence les sujets récurrents »,
 * observé sur pilote_demo le 2026-11-26.
 *
 * Il faut deux temps : `get_chantiers` trouve les départements où le chantier
 * est en difficulté, `get_chantier_commentaires` lit leurs commentaires. Tant
 * que `get_chantiers` portait le commentaire de la synthèse des résultats,
 * l'agent s'arrêtait au premier temps : il résumait ce seul commentaire, et
 * disait sans commentaire des départements qui en avaient d'autres.
 *
 * CH-005 est en difficulté dans les quatre départements bretons. Le Finistère
 * et l'Ille-et-Vilaine ont des commentaires typés qui disent autre chose que
 * la synthèse des résultats.
 */

const DEPARTEMENTS_BRETONS = ["DEPT-22", "DEPT-29", "DEPT-35", "DEPT-56"];

const EXPECTED = [
  {
    toolName: "get_chantiers",
    input: { view: "en_difficulte", chantier_ids: ["CH-005"] },
  },
  { toolName: "get_chantier_commentaires", input: { chantier_id: "CH-005" } },
];

scenarioEval({
  suite: "Synthèse des commentaires d'un chantier par département",
  group: "synthese",
  criteria: SYNTHESE_COMMENTAIRES_DEPARTEMENTS_CRITERIA,
  cases: [
    {
      question:
        "Fais-moi la synthèse des commentaires du CH-005 pour chaque département en difficulté. Mets en évidence les sujets récurrents",
      reason: "La demande observée en recette, sur un chantier du monde",
      truthScope: {
        territoires: DEPARTEMENTS_BRETONS,
        chantiersCommentes: ["CH-005"],
      },
      expected: EXPECTED,
    },
    {
      question:
        "Que disent les commentaires du CH-005 dans les départements où il est en difficulté ? Quels sujets reviennent ?",
      reason: "La même demande, formulée autrement",
      truthScope: {
        territoires: DEPARTEMENTS_BRETONS,
        chantiersCommentes: ["CH-005"],
      },
      expected: EXPECTED,
    },
  ],
});
