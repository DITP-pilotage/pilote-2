import SynthèseDesRésultatsProjetStructurant
  from '@/server/domain/projetStructurant/synthèseDesRésultats/SynthèseDesRésultats.interface';
import { Habilitations } from '@/server/domain/utilisateur/habilitation/Habilitation.interface';
import Habilitation from '@/server/domain/utilisateur/habilitation/Habilitation';
import SynthèseDesRésultatsProjetStructurantRepository
  from '@/server/domain/projetStructurant/synthèseDesRésultats/SynthèseDesRésultatsRepository.interface';

export default class RécupérerSynthèseDesRésultatsLaPlusRécenteProjetStructurantUseCase {
  constructor(
    private readonly synthèseDesRésultatsRepository: SynthèseDesRésultatsProjetStructurantRepository,
  ) {}

  async run(projetStructurantId: string, habilitations: Habilitations): Promise<SynthèseDesRésultatsProjetStructurant> {
    const habilitation = new Habilitation(habilitations);
    habilitation.vérifierLesHabilitationsEnLectureProjetStructurant(projetStructurantId);
    
    return this.synthèseDesRésultatsRepository.récupérerLaPlusRécente(projetStructurantId);
  }
}
