import { Maille } from '@/server/domain/maille/Maille.interface';
import { CodeInsee } from '@/server/domain/territoire/Territoire.interface';
import { Commentaires } from '@/server/domain/commentaire/Commentaire.interface';
import CommentaireRepository from '@/server/domain/commentaire/CommentaireRepository.interface';

export default class CommentaireRandomRepository implements CommentaireRepository {
  async findNewestByChantierIdAndTerritoire(_chantierId: string, _maille: Maille, _codeInsee: CodeInsee): Promise<Commentaires> {
    return (
      { 
        'freinsÀLever': {
          contenu: 'contenu commentaire',
          auteur: 'auteur commentaire',
          date: '2011-10-05T14:48:00.000',
        },
      }
    );
  }
}
