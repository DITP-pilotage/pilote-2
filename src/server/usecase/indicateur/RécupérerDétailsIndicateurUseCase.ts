import { dependencies } from '@/server/infrastructure/Dependencies';
import IndicateurRepository from '@/server/domain/indicateur/IndicateurRepository.interface';
import { Habilitations } from '@/server/domain/utilisateur/habilitation/Habilitation.interface';

export default class RécupérerDétailsIndicateurUseCase {
  constructor(
    private readonly indicateurRepository: IndicateurRepository = dependencies.getIndicateurRepository(),
  ) {}

  async run(indicateurId: string, habilitations: Habilitations) {
    return this.indicateurRepository.getById(indicateurId, habilitations);
  }
}
