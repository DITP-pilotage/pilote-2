import UtilisateurRepository from '@/server/domain/utilisateur/UtilisateurRepository.interface';
import Utilisateur from '@/server/domain/utilisateur/Utilisateur.interface';
import { Habilitations } from '@/server/domain/utilisateur/habilitation/Habilitation.interface';

export default class RécupérerListeUtilisateursUseCase {
  constructor(
    private readonly utilisateurRepository: UtilisateurRepository,
  ) {}

  async run(habilitation: Habilitations): Promise<Utilisateur[]> {
    return this.utilisateurRepository.récupérerTous(habilitation['utilisateurs.lecture'].chantiers, habilitation['utilisateurs.lecture'].territoires, false);
  }
}
