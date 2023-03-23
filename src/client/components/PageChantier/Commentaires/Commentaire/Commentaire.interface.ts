import { DétailsCommentaire, TypeCommentaire } from '@/server/domain/commentaire/Commentaire.interface';

export default interface CommentaireProps {
  titre: string,
  commentaire: DétailsCommentaire | null,
  type: TypeCommentaire,
}
