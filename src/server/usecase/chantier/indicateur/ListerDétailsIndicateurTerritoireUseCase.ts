import IndicateurRepository from '@/server/domain/indicateur/IndicateurRepository.interface';
import { Habilitations } from '@/server/domain/utilisateur/habilitation/Habilitation.interface';
import Habilitation from '@/server/domain/utilisateur/habilitation/Habilitation';
import { ProfilCode } from '@/server/domain/utilisateur/Utilisateur.interface';
import { DétailsIndicateurTerritoire } from '@/server/domain/indicateur/DétailsIndicateur.interface';

export class ListerDétailsIndicateurTerritoireUseCase {
  constructor(
    private readonly indicateurRepository: IndicateurRepository,
  ) {}

  async run(listeIndicateurId: string[], chantierId: string, habilitations: Habilitations, profil: ProfilCode) {
    const habilitation = new Habilitation(habilitations);
    habilitation.vérifierLesHabilitationsEnLecture(chantierId, null);

    const resultDétailsParMailles = await Promise.all(
      listeIndicateurId.map(indicateurId => this.indicateurRepository.récupérerDétailsTerritoirePourUnIndicateur(indicateurId, habilitations, profil).then(detailsTerritoire => ({ id: indicateurId, detailsTerritoire }))),
    );

    return resultDétailsParMailles.reduce((acc, val) => {
      acc[val.id] = val.detailsTerritoire;
      return acc;
    }, {} as Record<string, DétailsIndicateurTerritoire>);
  }
}
