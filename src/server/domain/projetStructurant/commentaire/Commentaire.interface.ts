
export const typesCommentaireProjetStructurant = ['dernieresRealisationEtSuiviDesDecisions', 'difficultésRencontréesEtRisquesAnticipés', 'solutionsProposéesEtProchainesÉtapes', 'partenariatsEtMoyensMobilisés'] as const;
export type TypeCommentaireProjetStructurant = typeof typesCommentaireProjetStructurant[number];

type CommentaireProjetStructurant = {
  id: string
  contenu: string
  date: string
  auteur: string
  type: TypeCommentaireProjetStructurant
} | null;

export default CommentaireProjetStructurant;
