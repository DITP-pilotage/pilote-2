import { DétailTerritoire } from '@/server/domain/territoire/Territoire.interface';
import { SyntheseDesResultatsRepository } from '@/server/chantiers/domain/ports/SyntheseDesResultatsRepository';
import { SyntheseDesResultats } from '@/server/chantiers/domain/SyntheseDesResultats';
import { Habilitations } from '@/server/domain/utilisateur/habilitation/Habilitation.interface';
import { Habilitation } from '@/server/domain/utilisateur/habilitation/Habilitation';

type Dependencies = {
  synthèsesDesRésultatsRepository: SyntheseDesResultatsRepository;
};

export class RécupérerHistoriqueSynthèseDesRésultatsUseCase {
  private readonly synthèsesDesRésultatsRepository: SyntheseDesResultatsRepository;

  constructor({
    synthèsesDesRésultatsRepository,
  }: Dependencies) {
    this.synthèsesDesRésultatsRepository = synthèsesDesRésultatsRepository;
  }

  async run(chantierId: string, territoireCode: DétailTerritoire['code'], habilitations: Habilitations): Promise<SyntheseDesResultats[]> {
    const habilitation = new Habilitation(habilitations);
    habilitation.vérifierLesHabilitationsEnLecture(chantierId, territoireCode);
    
    return this.synthèsesDesRésultatsRepository.récupérerHistorique(chantierId, territoireCode);
  }
}
