import { Maille } from '@/server/domain/maille/Maille.interface';
import { CodeInsee } from '@/server/domain/territoire/Territoire.interface';
import { Commentaires, DétailsCommentaire } from '@/server/domain/commentaire/Commentaire.interface';
import CommentaireRepository from '@/server/domain/commentaire/CommentaireRepository.interface';

export default class CommentaireRandomRepository implements CommentaireRepository {
  async getObjectifsByChantierId(_chantierId: string): Promise<DétailsCommentaire | null> {
    return {
      contenu: 'contenu de commentaire objectif',
      auteur: 'auteur de commentaire objectif',
      date: '01/01/2023',
    };
  }

  async findNewestByChantierIdAndTerritoire(_chantierId: string, _maille: Maille, _codeInsee: CodeInsee): Promise<Commentaires> {
    return (
      { 
        'freinsÀLever': {
          contenu: 'contenu commentaire',
          auteur: 'auteur commentaire',
          date: '01/01/2023',
        },
      }
    );
  }
}
