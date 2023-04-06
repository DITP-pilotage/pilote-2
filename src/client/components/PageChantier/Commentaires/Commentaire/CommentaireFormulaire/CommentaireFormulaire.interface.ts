import { Commentaire, TypeCommentaire } from '@/server/domain/commentaire/Commentaire.interface';

export default interface CommentaireFormulaireProps {
  contenuInitial?: string
  type: TypeCommentaire
  commentaireCrééCallback?: (commentaireCréé: Commentaire) => void
  annulationCallback?: () => void
}

export interface CommentaireFormulaireInputs {
  contenu: string,
  type: TypeCommentaire
}
