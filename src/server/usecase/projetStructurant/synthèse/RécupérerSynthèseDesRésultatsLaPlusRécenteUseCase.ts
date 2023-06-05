import { dependencies } from '@/server/infrastructure/Dependencies';
import SynthèseDesRésultatsProjetStructurant
  from '@/server/domain/projetStructurant/synthèseDesRésultats/SynthèseDesRésultats.interface';

export default class RécupérerSynthèseDesRésultatsLaPlusRécenteProjetStructurantUseCase {

  constructor(
    private readonly synthèseDesRésultatsRepository = dependencies.getSynthèseDesRésultatsProjetStructurantRepository(),
  ) {}

  async run(projetStructurantId: string): Promise<SynthèseDesRésultatsProjetStructurant> {
    return this.synthèseDesRésultatsRepository.récupérerLaPlusRécente(projetStructurantId);
  }
}
