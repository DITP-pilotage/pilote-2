import { Commentaires, DétailsCommentaire, TypeCommentaire } from '@/server/domain/commentaire/Commentaire.interface';
import { Maille } from '@/server/domain/maille/Maille.interface';
import { CodeInsee } from '@/server/domain/territoire/Territoire.interface';

export default interface CommentaireRepository {
  findNewestByChantierIdAndTerritoire(chantierId: string, maille: Maille, codeInsee: CodeInsee): Promise<Commentaires>;

  findAllByChantierIdAndTerritoireAndType(chantierId: string, maille: Maille, codeInsee: CodeInsee, type: TypeCommentaire): Promise<DétailsCommentaire[]>;
}
