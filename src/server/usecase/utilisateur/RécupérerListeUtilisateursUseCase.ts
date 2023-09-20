import UtilisateurRepository from '@/server/domain/utilisateur/UtilisateurRepository.interface';
import { dependencies } from '@/server/infrastructure/Dependencies';
import Utilisateur from '@/server/domain/utilisateur/Utilisateur.interface';
import { Habilitations } from '@/server/domain/utilisateur/habilitation/Habilitation.interface';

export default class RécupérerListeUtilisateursUseCase {
  constructor(
    private readonly utilisateurRepository: UtilisateurRepository = dependencies.getUtilisateurRepository(),
  ) {}

  async run(habilitation: Habilitations): Promise<Utilisateur[]> {
    return this.utilisateurRepository.récupérerTous(habilitation['utilisateurs.lecture'].chantiers, habilitation['utilisateurs.lecture'].territoires, false);
  }
}
