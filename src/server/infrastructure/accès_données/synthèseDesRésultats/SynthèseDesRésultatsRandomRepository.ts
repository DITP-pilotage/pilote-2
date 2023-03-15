import SynthèseDesRésultats from '@/server/domain/synthèseDesRésultats/SynthèseDesRésultats.interface';
import SynthèseDesRésultatsRepository from '@/server/domain/synthèseDesRésultats/SynthèseDesRésultatsRepository.interface';
import { Maille } from '@/server/domain/maille/Maille.interface';
import { CodeInsee } from '@/server/domain/territoire/Territoire.interface';

export default class SynthèseDesRésultatsRandomRepository implements SynthèseDesRésultatsRepository {
  async récupérerLaPlusRécenteParChantierIdEtTerritoire(_chantierId: string, _maille: Maille, _codeInsee: CodeInsee): Promise<SynthèseDesRésultats> {
    return {
      contenu: 'contenu synthèse des résultats',
      auteur: 'auteur synthèse des résultats',
      date: '2011-10-05T14:48:00.000',
    };
  }
}
