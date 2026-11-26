import { judged, withBase } from "../criterion";
import { PAS_DE_RECOPIE } from "../criteria/commentaires";

/** Les critères du scénario « Synthèse des commentaires d'un chantier par département ». */
export const SYNTHESE_COMMENTAIRES_DEPARTEMENTS_CRITERIA = withBase({
  criteria: [
    judged({
      id: "Départements en difficulté",
      rule: "Demande : chaque département où le chantier est en difficulté",
      instruction:
        "La réponse traite chaque département où le chantier est en difficulté selon les données reçues, et seulement ceux-là. Un département en difficulté omis, ou un département qui ne l'est pas, est non conforme : cite-le dans la preuve.",
    }),
    judged({
      id: "Tous les types de commentaires",
      rule: "Demande : la synthèse des commentaires, pas du seul commentaire de synthèse des résultats",
      instruction:
        "Pour chaque département, la synthèse rend compte des commentaires de la FICHE DE VÉRITÉ pour ce département, quel que soit leur type : synthèse des résultats, commentaires sur les données, autres résultats obtenus. Une réponse qui ne s'appuie que sur la synthèse des résultats d'un département alors que la fiche lui donne d'autres commentaires est non conforme : cite le contenu manquant (par exemple la fermeture de Carhaix ou le CHU de Rennes).",
    }),
    judged({
      id: "Sujets récurrents",
      rule: "Demande : mets en évidence les sujets récurrents",
      instruction:
        "La réponse dégage les sujets communs à plusieurs départements et nomme les départements concernés. Un sujet présenté comme récurrent alors qu'il n'apparaît que dans un département est non conforme.",
    }),
    PAS_DE_RECOPIE,
  ],
});
