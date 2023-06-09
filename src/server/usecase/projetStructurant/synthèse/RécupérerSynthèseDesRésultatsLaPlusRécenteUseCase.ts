import { dependencies } from '@/server/infrastructure/Dependencies';
import SynthèseDesRésultatsProjetStructurant
  from '@/server/domain/projetStructurant/synthèseDesRésultats/SynthèseDesRésultats.interface';
import { Habilitations } from '@/server/domain/utilisateur/habilitation/Habilitation.interface';
import Habilitation from '@/server/domain/utilisateur/habilitation/Habilitation';

export default class RécupérerSynthèseDesRésultatsLaPlusRécenteProjetStructurantUseCase {
  constructor(
    private readonly synthèseDesRésultatsRepository = dependencies.getSynthèseDesRésultatsProjetStructurantRepository(),
  ) {}

  async run(projetStructurantId: string, habilitations: Habilitations): Promise<SynthèseDesRésultatsProjetStructurant> {
    const habilitation = new Habilitation(habilitations);
    habilitation.vérifierLesHabilitationsEnLectureProjetStructurant(projetStructurantId);
    
    return this.synthèseDesRésultatsRepository.récupérerLaPlusRécente(projetStructurantId);
  }
}
