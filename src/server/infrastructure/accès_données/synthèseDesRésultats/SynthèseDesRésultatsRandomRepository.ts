import SynthèseDesRésultatsRepository from '@/server/domain/synthèseDesRésultats/SynthèseDesRésultatsRepository.interface';
import { Maille } from '@/server/domain/maille/Maille.interface';
import { CodeInsee } from '@/server/domain/territoire/Territoire.interface';
import { DétailsCommentaire } from '@/server/domain/commentaire/Commentaire.interface';

export default class SynthèseDesRésultatsRandomRepository implements SynthèseDesRésultatsRepository {
  async récupérerLaPlusRécenteParChantierIdEtTerritoire(_chantierId: string, _maille: Maille, _codeInsee: CodeInsee): Promise<DétailsCommentaire> {
    return {
      contenu: 'contenu synthèse des résultats',
      auteur: 'auteur synthèse des résultats',
      date: '01/01/2023',
    };
  }
}
