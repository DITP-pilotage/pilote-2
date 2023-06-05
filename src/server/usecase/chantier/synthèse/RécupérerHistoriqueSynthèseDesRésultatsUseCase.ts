import { dependencies } from '@/server/infrastructure/Dependencies';
import { DétailTerritoire } from '@/server/domain/territoire/Territoire.interface';
import SynthèseDesRésultatsRepository from '@/server/domain/chantier/synthèseDesRésultats/SynthèseDesRésultatsRepository.interface';
import SynthèseDesRésultats from '@/server/domain/chantier/synthèseDesRésultats/SynthèseDesRésultats.interface';
import { Habilitations } from '@/server/domain/utilisateur/habilitation/Habilitation.interface';
import Habilitation from '@/server/domain/utilisateur/habilitation/Habilitation';

export default class RécupérerHistoriqueSynthèseDesRésultatsUseCase {
  constructor(
    private readonly synthèsesDesRésultatsRepository: SynthèseDesRésultatsRepository = dependencies.getSynthèseDesRésultatsRepository(),
  ) {}

  async run(chantierId: string, territoireCode: DétailTerritoire['code'], habilitations: Habilitations): Promise<SynthèseDesRésultats[]> {
    const habilitation = new Habilitation(habilitations);
    habilitation.vérifierLesHabilitationsEnLecture(chantierId, territoireCode);
    
    return this.synthèsesDesRésultatsRepository.récupérerHistorique(chantierId, territoireCode);
  }
}
