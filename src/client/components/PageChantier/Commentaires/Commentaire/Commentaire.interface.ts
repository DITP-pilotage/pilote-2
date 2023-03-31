import { DétailsCommentaire, TypeCommentaire } from '@/server/domain/commentaire/Commentaire.interface';

export default interface CommentaireProps {
  type: TypeCommentaire,
  commentaire: DétailsCommentaire | null,
}
