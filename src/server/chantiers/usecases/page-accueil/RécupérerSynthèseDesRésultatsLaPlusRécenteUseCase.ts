import { SynthèseDesRésultats } from '@/server/domain/chantier/synthèseDesRésultats/SynthèseDesRésultats.interface';
import { SynthèseDesRésultatsRepository } from '@/server/domain/chantier/synthèseDesRésultats/SynthèseDesRésultatsRepository.interface';
import { Habilitation } from '@/server/domain/utilisateur/habilitation/Habilitation';
import { Habilitations } from '@/server/domain/utilisateur/habilitation/Habilitation.interface';

type Dependencies = {
  synthèsesDesRésultatsRepository: SynthèseDesRésultatsRepository;
};

export class RécupérerSynthèseDesRésultatsLaPlusRécenteUseCase {
  private readonly synthèsesDesRésultatsRepository: SynthèseDesRésultatsRepository;

  constructor({
    synthèsesDesRésultatsRepository,
  }: Dependencies) {
    this.synthèsesDesRésultatsRepository = synthèsesDesRésultatsRepository;
  }

  async run(chantierId: string, territoireCode: string, habilitations: Habilitations): Promise<SynthèseDesRésultats> {
    const habilitation = new Habilitation(habilitations);
    habilitation.vérifierLesHabilitationsEnLecture(chantierId, territoireCode);

    return this.synthèsesDesRésultatsRepository.récupérerLaPlusRécente(chantierId, territoireCode);
  }
}
