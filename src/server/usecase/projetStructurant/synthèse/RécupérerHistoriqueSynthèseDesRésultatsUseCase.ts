import { DétailTerritoire } from '@/server/domain/territoire/Territoire.interface';
import { Habilitations } from '@/server/domain/utilisateur/habilitation/Habilitation.interface';
import Habilitation from '@/server/domain/utilisateur/habilitation/Habilitation';
import SynthèseDesRésultatsProjetStructurant
  from '@/server/domain/projetStructurant/synthèseDesRésultats/SynthèseDesRésultats.interface';
import SynthèseDesRésultatsProjetStructurantRepository
  from '@/server/domain/projetStructurant/synthèseDesRésultats/SynthèseDesRésultatsRepository.interface';

export default class RécupérerHistoriqueSynthèseDesRésultatsProjetStructurantUseCase {
  constructor(
    private readonly synthèsesDesRésultatsRepository: SynthèseDesRésultatsProjetStructurantRepository,
  ) {}

  async run(projetStructurantId: string, territoireCode: DétailTerritoire['code'], habilitations: Habilitations): Promise<SynthèseDesRésultatsProjetStructurant[]> {
    const habilitation = new Habilitation(habilitations);
    habilitation.vérifierLesHabilitationsEnSaisieDesPublicationsProjetsStructurants(territoireCode);
    
    return this.synthèsesDesRésultatsRepository.récupérerHistorique(projetStructurantId);
  }
}
