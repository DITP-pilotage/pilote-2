import UtilisateurRepository from '@/server/gestion-utilisateur/domain/ports/UtilisateurRepository.interface';
import { UtilisateurIAMRepository } from '@/server/gestion-utilisateur/domain/ports/UtilisateurIAMRepository';
import Utilisateur from '@/server/gestion-utilisateur/domain/Utilisateur.interface';
import { TokenAPIInformationRepository } from '@/server/gestion-utilisateur/domain/ports/TokenAPIInformationRepository';
import { ProfilCode } from '@/server/domain/utilisateur/Utilisateur.interface';
import { ProfilEnum } from '@/server/app/enum/profil.enum';

type Dependencies = {
  utilisateurRepository: UtilisateurRepository,
  utilisateurIAMRepository: UtilisateurIAMRepository,
  tokenAPIInformationRepository: TokenAPIInformationRepository,
};

export default class ReactiverUnUtilisateurUseCase {
  private utilisateurRepository: UtilisateurRepository;

  private utilisateurIAMRepository: UtilisateurIAMRepository;


  constructor({
    utilisateurRepository,
    utilisateurIAMRepository,
  }: Dependencies) {
    this.utilisateurRepository = utilisateurRepository;
    this.utilisateurIAMRepository = utilisateurIAMRepository;
  }

  async run(email: Utilisateur['email'], profilAuteur: ProfilCode): Promise<void> {
    const utilisateurAReactiver = await this.utilisateurRepository.récupérer(email);
    if (!utilisateurAReactiver) {
      throw new Error('Le compte à supprimer n’existe pas.');
    }

    if (profilAuteur !== ProfilEnum.DITP_ADMIN) {
      throw new Error('Le profil n\'est pas autorisé pour la réactiviation de compte');
    }

    await this.utilisateurRepository.reactiver(email);

    if (process.env.IMPORT_KEYCLOAK_URL) {
      await this.utilisateurIAMRepository.reactive(email);
    }
  }
}
