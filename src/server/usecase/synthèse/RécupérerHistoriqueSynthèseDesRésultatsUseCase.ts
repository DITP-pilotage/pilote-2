import { dependencies } from '@/server/infrastructure/Dependencies';
import { Maille } from '@/server/domain/maille/Maille.interface';
import { CodeInsee } from '@/server/domain/territoire/Territoire.interface';
import SynthèseDesRésultatsRepository from '@/server/domain/synthèseDesRésultats/SynthèseDesRésultatsRepository.interface';
import SynthèseDesRésultats from '@/server/domain/synthèseDesRésultats/SynthèseDesRésultats.interface';

export default class RécupérerHistoriqueSynthèseDesRésultatsUseCase {
  constructor(
    private readonly synthèsesDesRésultatsRepository: SynthèseDesRésultatsRepository = dependencies.getSynthèseDesRésultatsRepository(),
  ) {}

  async run(chantierId: string, maille: Maille, codeInsee: CodeInsee): Promise<{ historiqueDeLaSynthèseDesRésultats: SynthèseDesRésultats[] }> {
    return {
      historiqueDeLaSynthèseDesRésultats: await this.synthèsesDesRésultatsRepository.récupérerHistorique(chantierId, maille, codeInsee),
    };
  }
}
