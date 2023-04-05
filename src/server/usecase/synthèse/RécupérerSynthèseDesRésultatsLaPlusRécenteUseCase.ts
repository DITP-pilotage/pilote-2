import { dependencies } from '@/server/infrastructure/Dependencies';
import SynthèseDesRésultatsRepository from '@/server/domain/synthèseDesRésultats/SynthèseDesRésultatsRepository.interface';
import { Maille } from '@/server/domain/maille/Maille.interface';
import { CodeInsee } from '@/server/domain/territoire/Territoire.interface';
import SynthèseDesRésultats from '@/server/domain/synthèseDesRésultats/SynthèseDesRésultats.interface';

export default class RécupérerSynthèseDesRésultatsLaPlusRécenteUseCase {
  constructor(
    private readonly synthèsesDesRésultatsRepository: SynthèseDesRésultatsRepository = dependencies.getSynthèseDesRésultatsRepository(),
  ) {}

  async run(chantierId: string, maille: Maille, codeInsee: CodeInsee): Promise<SynthèseDesRésultats> {
    return this.synthèsesDesRésultatsRepository.récupérerLaPlusRécenteParChantierIdEtTerritoire(chantierId, maille, codeInsee);
  }
}
