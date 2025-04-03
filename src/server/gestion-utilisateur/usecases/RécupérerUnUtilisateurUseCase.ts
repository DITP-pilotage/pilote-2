import { UtilisateurRepository } from '@/server/domain/utilisateur/UtilisateurRepository.interface';
import { Utilisateur } from '@/server/gestion-utilisateur/domain/Utilisateur';

type Dependencies = {
  utilisateurRepository: UtilisateurRepository;
};

export class RécupérerUnUtilisateurUseCase {
  private readonly utilisateurRepository: UtilisateurRepository;

  constructor({ utilisateurRepository }: Dependencies) {
    this.utilisateurRepository = utilisateurRepository;
  }

  async run(utilisateurId: Utilisateur['id']): Promise<Utilisateur | null> {
    const utilisateur = await this.utilisateurRepository.getById(utilisateurId);
    if (!utilisateur) {
      return null;
    }

    return utilisateur;
  }
}
