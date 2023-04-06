import { Commentaire, TypeCommentaire } from '@/server/domain/commentaire/Commentaire.interface';

export default interface CommentaireProps {
  type: TypeCommentaire,
  commentaireInitial: Commentaire,
}
