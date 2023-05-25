import { dependencies } from '@/server/infrastructure/Dependencies';
import IndicateurRepository from '@/server/domain/chantier/indicateur/IndicateurRepository.interface';
import { Habilitations } from '@/server/domain/utilisateur/habilitation/Habilitation.interface';
import Habilitation from '@/server/domain/utilisateur/habilitation/Habilitation';

export default class RécupérerDétailsIndicateurUseCase {
  constructor(
    private readonly indicateurRepository: IndicateurRepository = dependencies.getIndicateurRepository(),
  ) {}

  async run(indicateurId: string, habilitations: Habilitations) {
    const chantierId = await this.indicateurRepository.récupérerChantierIdAssocié(indicateurId);
    const habilitation = new Habilitation(habilitations);
    habilitation.vérifierLesHabilitationsEnLecture(chantierId, null);
    
    return this.indicateurRepository.getById(indicateurId, habilitations);
  }
}
