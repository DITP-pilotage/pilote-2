import { dependencies } from '@/server/infrastructure/Dependencies';
import IndicateurRepository from '@/server/domain/indicateur/IndicateurRepository.interface';
import { Habilitations } from '@/server/domain/utilisateur/habilitation/Habilitation.interface';
import Habilitation from '@/server/domain/utilisateur/habilitation/Habilitation';
import { Profil } from '@/server/domain/utilisateur/Utilisateur.interface';

export default class RécupérerDétailsIndicateurUseCase {
  constructor(
    private readonly indicateurRepository: IndicateurRepository = dependencies.getIndicateurRepository(),
  ) {}

  async run(indicateurId: string, habilitations: Habilitations, profil: Profil) {
    const chantierId = await this.indicateurRepository.récupérerChantierIdAssocié(indicateurId);
    const habilitation = new Habilitation(habilitations);
    habilitation.vérifierLesHabilitationsEnLecture(chantierId, null);
    
    return this.indicateurRepository.récupérerDétailsParMailles(indicateurId, habilitations, profil);
  }
}
