import { IndicateurRepository } from '@/server/chantiers/domain/ports/IndicateurRepository';
import { Habilitation } from '@/server/gestion-utilisateur/domain/habilitation/Habilitation';
import { Habilitations } from '@/server/gestion-utilisateur/domain/habilitation/Habilitation.interface';
import { ProfilCode } from '@/server/gestion-utilisateur/domain/Profil';

type Dependencies = {
  indicateurRepository: IndicateurRepository;
};

export class RécupérerDétailsIndicateurUseCase {
  private readonly indicateurRepository: IndicateurRepository;

  constructor({ indicateurRepository }: Dependencies) {
    this.indicateurRepository = indicateurRepository;
  }

  async run(indicateurId: string, habilitations: Habilitations, profil: ProfilCode, jalon: number) {
    const chantierId = await this.indicateurRepository.récupérerChantierIdAssocié(indicateurId);
    const habilitation = new Habilitation(habilitations);
    habilitation.vérifierLesHabilitationsEnLecture(chantierId, null);
    
    return this.indicateurRepository.récupérerDétailsParMailles(indicateurId, habilitations, profil, jalon);
  }
}
