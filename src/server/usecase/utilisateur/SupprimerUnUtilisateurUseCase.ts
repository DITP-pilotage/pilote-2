import UtilisateurRepository from '@/server/domain/utilisateur/UtilisateurRepository.interface';
import { dependencies } from '@/server/infrastructure/Dependencies';
import Utilisateur, { ProfilCode } from '@/server/domain/utilisateur/Utilisateur.interface';
import { UtilisateurIAMRepository } from '@/server/domain/utilisateur/UtilisateurIAMRepository';

export default class SupprimerUnUtilisateurUseCase {
  constructor(
    private readonly utilisateurRepository: UtilisateurRepository = dependencies.getUtilisateurRepository(),
    private readonly utilisateurIAMRepository: UtilisateurIAMRepository = dependencies.getUtilisateurIAMRepository(),
  ) {}

  async run(email: Utilisateur['email'], profil: ProfilCode): Promise<void> {
    if (profil !== 'DITP_ADMIN')
      throw new Error("Vous n'êtes pas autorisé à supprimer ce compte.");

    const utilisateurExiste = await this.utilisateurRepository.récupérer(email);
    if (!utilisateurExiste) 
      throw new Error('Le compte à supprimer n’existe pas.');

    await this.utilisateurRepository.supprimer(email);

    if (process.env.IMPORT_KEYCLOAK_URL) {
      await this.utilisateurIAMRepository.supprime(email);
    }
  }
}
