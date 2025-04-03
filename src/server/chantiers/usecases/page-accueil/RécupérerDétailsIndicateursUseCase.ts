import { Habilitation } from '@/server/gestion-utilisateur/domain/habilitation/Habilitation';
import { Habilitations } from '@/server/gestion-utilisateur/domain/habilitation/Habilitation.interface';
import { IndicateurRepository } from '@/server/chantiers/domain/ports/IndicateurRepository';

type Dependencies = {
  indicateurRepository: IndicateurRepository;
};

export class RécupérerDétailsIndicateursUseCase {
  private readonly indicateurRepository: IndicateurRepository;

  constructor({ indicateurRepository }: Dependencies) {
    this.indicateurRepository = indicateurRepository;
  }

  async run(chantierId: string, territoireCodes: string[], habilitations: Habilitations, jalon: number) {
    const habilitation = new Habilitation(habilitations);
    territoireCodes.forEach(territoireCode => {
      habilitation.vérifierLesHabilitationsEnLecture(chantierId, territoireCode);
    });

    return this.indicateurRepository.récupererDétailsParChantierIdEtTerritoire(chantierId, territoireCodes, jalon);
  }
}
