import IndicateurRepository from '@/server/domain/indicateur/IndicateurRepository.interface';
import { Habilitations } from '@/server/domain/utilisateur/habilitation/Habilitation.interface';
import Habilitation from '@/server/domain/utilisateur/habilitation/Habilitation';
import { ProfilCode } from '@/server/domain/utilisateur/Utilisateur.interface';
import { DétailsIndicateurTerritoire } from '@/server/domain/indicateur/DétailsIndicateur.interface';
import { MailleInterne } from '@/server/domain/maille/Maille.interface';

export class ListerDétailsIndicateurTerritoireUseCase {
  constructor(
    private readonly indicateurRepository: IndicateurRepository,
  ) {}

  async run(listeIndicateurId: string[], chantierId: string, maille: MailleInterne, habilitations: Habilitations, profil: ProfilCode) {
    const habilitation = new Habilitation(habilitations);
    habilitation.vérifierLesHabilitationsEnLecture(chantierId, null);

    const resultDétailsParMailles = await Promise.all(
      listeIndicateurId.map(indicateurId => this.indicateurRepository.récupérerDétailsTerritoire(indicateurId, maille, habilitations, profil).then(detailsTerritoire => ({ id: indicateurId, detailsTerritoire }))),
    );

    return resultDétailsParMailles.reduce((acc, val) => {
      acc[val.id] = val.detailsTerritoire;
      return acc;
    }, {} as Record<string, DétailsIndicateurTerritoire>);
  }
}
