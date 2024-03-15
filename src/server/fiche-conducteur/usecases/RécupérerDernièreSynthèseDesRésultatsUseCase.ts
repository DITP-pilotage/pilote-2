import { SynthèseDesRésultatsRepository } from '@/server/fiche-conducteur/domain/ports/SynthèseDesRésultatsRepository';
import { SyntheseDesResultats } from '@/server/fiche-conducteur/domain/SyntheseDesResultats';

interface Dependencies {
  synthèseDesRésultatsRepository: SynthèseDesRésultatsRepository
}

export class RécupérerDernièreSynthèseDesRésultatsUseCase {
  private synthèseDesRésultatsRepository: SynthèseDesRésultatsRepository;

  constructor({ synthèseDesRésultatsRepository }: Dependencies) {
    this.synthèseDesRésultatsRepository = synthèseDesRésultatsRepository;
  }

  async run({ chantierId }: { chantierId: string }): Promise<SyntheseDesResultats | null> {
    return this.synthèseDesRésultatsRepository.recupererLaPlusRecenteMailleNatParChantierId(chantierId);
  }
}
