import { dependencies } from '@/server/infrastructure/Dependencies';
import IndicateurRepository from '@/server/domain/indicateur/IndicateurRepository.interface';
import { Habilitations } from '@/server/domain/utilisateur/habilitation/Habilitation.interface';
import Habilitation from '@/server/domain/utilisateur/habilitation/Habilitation';

export default class RécupérerDétailsIndicateursUseCase {
  constructor(
    private readonly indicateurRepository: IndicateurRepository = dependencies.getIndicateurRepository(),
  ) {}

  async run(chantierId: string, territoireCodes: string[], habilitations: Habilitations) {
    const habilitation = new Habilitation(habilitations);
    territoireCodes.forEach(territoireCode => {
      habilitation.vérifierLesHabilitationsEnLecture(chantierId, territoireCode);
    });
    
    return this.indicateurRepository.récupererDétailsParChantierIdEtTerritoire(chantierId, territoireCodes);
  }
}
