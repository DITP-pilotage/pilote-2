import { scenarioEval } from "../scenarioEval";
import { SYNTHESE_COMMENTAIRES_DEPARTEMENTS_CRITERIA } from "./syntheseCommentairesDepartements.criteria";
import { seedCommentairesDepartementsBretons } from "./seedCommentairesDepartementsBretons";

/**
 * Scénario « Synthèse des commentaires d'un chantier par département » (DITP).
 * Demande de la recette : « synthèse des commentaires du chantier 70 pour
 * chaque département en difficulté ». La réponse n'était construite que de la
 * synthèse des résultats que renvoie `get_chantiers` ; elle disait que des
 * départements n'avaient pas de commentaire alors qu'ils en avaient de typés,
 * sans synthèse.
 *
 * Le scénario prouve que l'agent liste les départements en difficulté avec
 * `get_chantiers`, puis lit leurs commentaires avec `get_chantier_commentaires`
 * au lieu de se contenter de la synthèse, et qu'il ne conclut pas à l'absence
 * de commentaire à tort.
 *
 * Les départements bretons de CH-005 (voir
 * `seedCommentairesDepartementsBretons`) :
 * - Côtes-d'Armor : plus en difficulté, son commentaire ne doit pas apparaître ;
 * - Finistère : synthèse propre, fermetures de nuit des urgences, maison
 *   médicale de garde ;
 * - Ille-et-Vilaine : sans synthèse, fermetures de nuit des urgences,
 *   recrutement de médecins régulateurs ;
 * - Morbihan : sans synthèse ni commentaire.
 *
 * Les commentaires nationaux (NAT-FR) sont lus avec les départements pour un
 * profil DITP : la fiche de vérité en contient, ce n'est pas un département.
 *
 * Ce scénario est attendu en échec sur le code qui précède la lecture de tous
 * les types de commentaires : c'est le défaut qu'il reproduit.
 */

const TRUTH_SCOPE = {
  territoires: ["DEPT-22", "DEPT-29", "DEPT-35", "DEPT-56"],
  chantiersCommentes: ["CH-005"],
  commentairesSurChaqueTerritoire: true,
};

const EXPECTED = [
  {
    toolName: "get_chantiers",
    input: { view: "en_difficulte", chantier_ids: ["CH-005"] },
  },
  {
    toolName: "get_chantier_commentaires",
    input: { chantier_id: "CH-005" },
  },
];

scenarioEval({
  suite: "Synthèse des commentaires d'un chantier par département",
  group: "synthese",
  criteria: SYNTHESE_COMMENTAIRES_DEPARTEMENTS_CRITERIA,
  seedSupplementaire: seedCommentairesDepartementsBretons,
  cases: [
    {
      question:
        "Fais-moi la synthèse des commentaires du CH-005 pour chaque département breton en difficulté. Mets en évidence les sujets récurrents.",
      reason:
        "départements en difficulté puis tous leurs commentaires, pas la seule synthèse",
      truthScope: TRUTH_SCOPE,
      expected: EXPECTED,
    },
    {
      question:
        "Que disent les commentaires du CH-005 dans les départements de Bretagne où il est en difficulté ? Quels sujets reviennent ?",
      reason:
        "même demande autrement formulée : les commentaires, pas la synthèse",
      truthScope: TRUTH_SCOPE,
      expected: EXPECTED,
    },
  ],
});
