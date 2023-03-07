import SynthèseDesRésultatsRepository from '@/server/domain/synthèseDesRésultats/SynthèseDesRésultatsRepository.interface';
import SynthèseDesRésultats from '@/server/domain/synthèseDesRésultats/SynthèseDesRésultats.interface';
import { Maille } from '@/server/domain/maille/Maille.interface';
import { CodeInsee } from '@/server/domain/territoire/Territoire.interface';
import { DétailsCommentaire } from '@/server/domain/chantier/Commentaire.interface';

export default class SynthèseDesRésultatsRandomRepository implements SynthèseDesRésultatsRepository {

  // FIXME: attention, la méthode findNewestByChantierId de synthèseDesRésultatsRepository est dépréciée
  //   préférez l'usage de findNewestByChantierIdAndTerritoire dans le même repository
  async findNewestByChantierId(chantierId: string): Promise<SynthèseDesRésultats | null> {
    // DEPRECATED
    return {
      commentaireSynthèse: {
        contenu: `Le suivi de l’indicateur relatif à la protection Animale... ${chantierId}`,
        date: '2022-09-05 00:00:00.000',
      },
    };
  }

  récupérerLaPlusRécenteParChantierIdEtTerritoire(_chantierId: string, _maille: Maille, _codeInsee: CodeInsee): Promise<DétailsCommentaire> {
    throw new Error('Not Implemented');
  }
}
