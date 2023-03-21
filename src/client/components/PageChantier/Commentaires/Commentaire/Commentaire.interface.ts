import Chantier from '@/server/domain/chantier/Chantier.interface';
import { DétailsCommentaire, TypeCommentaire } from '@/server/domain/commentaire/Commentaire.interface';

export default interface CommentaireProps {
  titre: TypeCommentaire,
  commentaire: DétailsCommentaire | null,
  type: TypeCommentaire,
  chantierId: Chantier['id']
}
