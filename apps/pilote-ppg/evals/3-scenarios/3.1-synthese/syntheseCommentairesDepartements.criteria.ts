import { judged, withBase, type MechanicalCriterion } from "../criterion";
import { PAS_DE_RECOPIE } from "../criteria/commentaires";
import { normalize } from "../mechanicalChecks";

/**
 * « Pas de recopie » ne vaut que pour une question qui demande une synthèse
 * ou un résumé : sinon (« Que disent les commentaires… »), la règle D2
 * prescrit une restitution fidèle. Même critère, dans ce seul scénario.
 */
const PAS_DE_RECOPIE_SUR_DEMANDE_DE_SYNTHESE: MechanicalCriterion = {
  ...PAS_DE_RECOPIE,
  applicable: (evidence) => /synth|resum/.test(normalize(evidence.question)),
};

/**
 * Les critères du scénario « Synthèse des commentaires d'un chantier par
 * département ». Dans la fiche de vérité, chaque département est une entrée de
 * `commentaires[].resultats` (`territoire_nom`, `territoire_code`) dont
 * `commentaires` liste les types ; `chantiersEnDifficulte` dit où le chantier
 * est en difficulté. L'entrée NAT-FR porte les types nationaux : ce n'est pas
 * un département.
 */
export const SYNTHESE_COMMENTAIRES_DEPARTEMENTS_CRITERIA = withBase({
  criteria: [
    judged({
      id: "Départements en difficulté",
      rule: "Demande : pour chaque département où le chantier est en difficulté",
      instruction:
        "La réponse traite chaque département où la fiche de vérité (chantiersEnDifficulte) place le chantier en difficulté, et seulement ceux-là. Un département omis est non conforme. Restituer les commentaires d'un département où le chantier n'est pas en difficulté (par exemple les Côtes-d'Armor) comme ceux d'un département en difficulté est non conforme : le citer dans la preuve. Citer un département pour dire qu'il n'est pas en difficulté, ou qu'il est écarté, est conforme. NAT-FR (national) n'est pas un département : ne pas l'exiger, et ne pas le compter comme tel.",
    }),
    judged({
      id: "Tous les types de commentaires",
      rule: "Demande : les commentaires du chantier, quel que soit leur type",
      instruction:
        "Pour chaque département traité, la réponse rend compte de ses commentaires de tous les types présents dans la fiche (par département : commentaires sur les données, autres résultats obtenus, synthèse des résultats), pas de la seule synthèse des résultats. Exemples attendus : les fermetures de nuit des urgences du Finistère et d'Ille-et-Vilaine, la maison médicale de garde du Finistère, les médecins régulateurs recrutés en Ille-et-Vilaine. S'appuyer sur la seule synthèse alors que la fiche donne d'autres commentaires pour ce département est non conforme. Les commentaires nationaux (NAT-FR) ne sont pas ceux d'un département : ne pas les exiger par département.",
    }),
    judged({
      id: "Pas d'absence inventée",
      rule: "Factualité : ne pas dire qu'un département n'a pas de commentaire quand il en a",
      instruction:
        "La réponse ne dit « sans commentaire » (ou équivalent : rien à signaler, aucun commentaire) que d'un département qui n'a AUCUN commentaire départemental dans la fiche (le Morbihan). Le dire d'un département qui a des commentaires sans synthèse (l'Ille-et-Vilaine) est non conforme. Les commentaires nationaux (NAT-FR) ne comptent pas comme des commentaires du département.",
    }),
    judged({
      id: "Sujets récurrents",
      rule: "Demande : mettre en évidence les sujets récurrents",
      instruction:
        "Un sujet présenté comme récurrent nomme au moins deux départements, et s'appuie, pour chaque département nommé, sur un fait de la fiche de ce département. Sujets communs au Finistère et à l'Ille-et-Vilaine, entre autres : les fermetures de nuit des urgences, et le report des patients vers d'autres villes (Quimper ou Brest pour le Finistère, Vannes et Rennes pour l'Ille-et-Vilaine). Un sujet propre à un seul département (la maison médicale de garde, les recrutements de médecins régulateurs) présenté comme récurrent est non conforme. Une réponse qui ne présente aucun sujet comme récurrent alors que la fiche en contient un est non conforme.",
    }),
    PAS_DE_RECOPIE_SUR_DEMANDE_DE_SYNTHESE,
  ],
});
