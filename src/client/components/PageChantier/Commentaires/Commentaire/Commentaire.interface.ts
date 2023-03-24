import Chantier from '@/server/domain/chantier/Chantier.interface';
import { DétailsCommentaire, TypeCommentaire } from '@/server/domain/commentaire/Commentaire.interface';

export default interface CommentaireProps {
  type: TypeCommentaire,
  commentaire: DétailsCommentaire | null,
  chantierId: Chantier['id']
}
