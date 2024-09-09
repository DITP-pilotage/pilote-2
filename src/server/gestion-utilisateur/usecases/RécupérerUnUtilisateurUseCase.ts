import UtilisateurRepository from '@/server/domain/utilisateur/UtilisateurRepository.interface';
import Utilisateur from '@/server/domain/utilisateur/Utilisateur.interface';

export default class RécupérerUnUtilisateurUseCase {
  constructor(
    private readonly utilisateurRepository: UtilisateurRepository,
  ) {}

  async run(utilisateurId: Utilisateur['id']): Promise<Utilisateur | null> {
    const utilisateur = await this.utilisateurRepository.getById(utilisateurId);
    if (!utilisateur) {
      return null;
    }

    return utilisateur;
  }
}
