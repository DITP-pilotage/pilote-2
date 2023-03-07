import { DétailsCommentaire } from '@/server/domain/chantier/Commentaire.interface';

export default interface CommentaireProps {
  titre: string,
  commentaire: DétailsCommentaire | null,
}
