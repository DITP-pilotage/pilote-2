import SynthèseDesRésultatsRepository
  from '@/server/domain/chantier/synthèseDesRésultats/SynthèseDesRésultatsRepository.interface';
import SynthèseDesRésultats from '@/server/domain/chantier/synthèseDesRésultats/SynthèseDesRésultats.interface';
import Habilitation from '@/server/domain/utilisateur/habilitation/Habilitation';
import { Habilitations } from '@/server/domain/utilisateur/habilitation/Habilitation.interface';

export default class RécupérerSynthèseDesRésultatsLaPlusRécenteUseCase {
  constructor(
    private readonly synthèsesDesRésultatsRepository: SynthèseDesRésultatsRepository,
  ) {}

  async run(chantierId: string, territoireCode: string, habilitations: Habilitations): Promise<SynthèseDesRésultats> {
    const habilitation = new Habilitation(habilitations);
    habilitation.vérifierLesHabilitationsEnLecture(chantierId, territoireCode);

    return this.synthèsesDesRésultatsRepository.récupérerLaPlusRécente(chantierId, territoireCode);
  }
}
