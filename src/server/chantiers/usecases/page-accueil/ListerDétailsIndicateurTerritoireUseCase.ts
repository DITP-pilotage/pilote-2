import { Habilitation } from '@/server/gestion-utilisateur/domain/habilitation/Habilitation';
import { Habilitations } from '@/server/gestion-utilisateur/domain/habilitation/Habilitation.interface';
import { ProfilCode } from '@/server/gestion-utilisateur/domain/Profil';
import { IndicateurRepository } from '@/server/chantiers/domain/ports/IndicateurRepository';

type Dependencies = {
  indicateurRepository: IndicateurRepository;
};

export class ListerDétailsIndicateurTerritoireUseCase {
  private readonly indicateurRepository: IndicateurRepository;

  constructor({ indicateurRepository }: Dependencies) {
    this.indicateurRepository = indicateurRepository;
  }

  async run(listeIndicateurId: string[], chantierId: string, habilitations: Habilitations, profil: ProfilCode, jalon: number) {
    const habilitation = new Habilitation(habilitations);
    habilitation.vérifierLesHabilitationsEnLecture(chantierId, null);

    const resultDétailsParMailles = await Promise.all(
      listeIndicateurId.map(indicateurId => this.indicateurRepository.récupérerDétailsTerritoirePourUnIndicateur(indicateurId, habilitations, profil, jalon).then(detailsTerritoire => ({ id: indicateurId, detailsTerritoire }))),
    );

    return resultDétailsParMailles.reduce((acc, val) => {
      acc[val.id] = val.detailsTerritoire;
      return acc;
    }, {} as Record<string, DétailsIndicateurTerritoire>);
  }
}
