import UtilisateurRepository from '@/server/domain/utilisateur/UtilisateurRepository.interface';
import { dependencies } from '@/server/infrastructure/Dependencies';
import Utilisateur, { UtilisateurÀCréerOuMettreÀJourSansHabilitation } from '@/server/domain/utilisateur/Utilisateur.interface';
import { HabilitationsÀCréerOuMettreÀJourCalculées } from '@/server/domain/utilisateur/habilitation/Habilitation.interface';

export default class RécupérerListeUtilisateursExistantsUseCase {
  constructor(
    private readonly utilisateurRepository: UtilisateurRepository = dependencies.getUtilisateurRepository(),
  ) {}

  async run(utilisateurs: (UtilisateurÀCréerOuMettreÀJourSansHabilitation & { habilitations: HabilitationsÀCréerOuMettreÀJourCalculées })[]): Promise<Utilisateur['email'][]> {
    return this.utilisateurRepository.récupérerExistants(utilisateurs);
  }
}
