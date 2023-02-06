import SynthèseDesRésultatsRepository from '@/server/domain/chantier/SynthèseDesRésultatsRepository.interface';
import SynthèseDesRésultats from '@/server/domain/chantier/SynthèseDesRésultats.interface';

export default class SynthèseDesRésultatsRandomRepository implements SynthèseDesRésultatsRepository {
  async findNewestByChantierId(chantierId: string): Promise<SynthèseDesRésultats | null> {
    return {
      commentaireSynthèse: {
        contenu: `Le suivi de l’indicateur relatif à la protection Animale... ${chantierId}`,
        date: '2022-09-05 00:00:00.000',
      },
    };
  }
}
