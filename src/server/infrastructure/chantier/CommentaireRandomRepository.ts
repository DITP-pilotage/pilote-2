import { Maille } from '@/server/domain/maille/Maille.interface';
import { CodeInsee } from '@/server/domain/territoire/Territoire.interface';
import { Commentaires, DétailsCommentaire } from '@/server/domain/chantier/Commentaire.interface';
import CommentaireRepository from '@/server/domain/chantier/CommentaireRepository.interface';

export default class CommentaireRandomRepository implements CommentaireRepository {
  getObjectifsByChantierId(_chantierId: string): Promise<DétailsCommentaire | null> {
    throw new Error('Not Implemented');
  }

  findNewestByChantierIdAndTerritoire(_chantierId: string, _maille: Maille, _codeInsee: CodeInsee): Promise<Commentaires> {
    throw new Error('Not Implemented');
  }
}
