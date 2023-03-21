import Chantier from '@/server/domain/chantier/Chantier.interface';
import { Commentaires } from '@/server/domain/commentaire/Commentaire.interface';

export default interface CommentairesProps {
  commentaires: Commentaires
  chantierId: Chantier['id']
}
