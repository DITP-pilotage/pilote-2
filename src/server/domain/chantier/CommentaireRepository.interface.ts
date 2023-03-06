import { Commentaires } from '@/server/domain/chantier/Commentaire.interface';
import { Maille } from '@/server/domain/maille/Maille.interface';
import { CodeInsee } from '@/server/domain/territoire/Territoire.interface';

export default interface CommentaireRepository {
  findNewestByChantierIdAndTerritoire(chantierId: string, maille: Maille, codeInsee: CodeInsee): Promise<Commentaires>;
}
