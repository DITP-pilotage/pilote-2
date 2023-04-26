import { dependencies } from '@/server/infrastructure/Dependencies';
import IndicateurRepository from '@/server/domain/indicateur/IndicateurRepository.interface';
import { CodeInsee } from '@/server/domain/territoire/Territoire.interface';
import { Maille } from '@/server/domain/maille/Maille.interface';

export default class RécupérerDétailsIndicateursUseCase {
  constructor(
    private readonly indicateurRepository: IndicateurRepository = dependencies.getIndicateurRepository(),
  ) {}

  async run(chantierId: string, maille: Maille, codesInsee: CodeInsee[]) {
    return this.indicateurRepository.récupererDétailsParChantierIdEtTerritoire(chantierId, maille, codesInsee);
  }
}
