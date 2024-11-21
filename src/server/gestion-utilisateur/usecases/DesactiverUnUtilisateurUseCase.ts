import UtilisateurRepository from '@/server/gestion-utilisateur/domain/ports/UtilisateurRepository.interface';
import { UtilisateurIAMRepository } from '@/server/gestion-utilisateur/domain/ports/UtilisateurIAMRepository';
import Utilisateur from '@/server/gestion-utilisateur/domain/Utilisateur.interface';
import { Habilitations } from '@/server/gestion-utilisateur/domain/habilitation/Habilitation.interface';
import { Profil } from '@/server/domain/profil/Profil.interface';
import Habilitation from '@/server/gestion-utilisateur/domain/habilitation/Habilitation';
import { TokenAPIInformationRepository } from '@/server/gestion-utilisateur/domain/ports/TokenAPIInformationRepository';

type Dependencies = {
  utilisateurRepository: UtilisateurRepository,
  utilisateurIAMRepository: UtilisateurIAMRepository,
  tokenAPIInformationRepository: TokenAPIInformationRepository,
};

export default class DesactiverUnUtilisateurUseCase {
  private utilisateurRepository: UtilisateurRepository;

  private utilisateurIAMRepository: UtilisateurIAMRepository;

  private tokenAPIInformationRepository: TokenAPIInformationRepository;

  constructor({
    utilisateurRepository,
    utilisateurIAMRepository,
    tokenAPIInformationRepository,
  }: Dependencies) {
    this.utilisateurRepository = utilisateurRepository;
    this.utilisateurIAMRepository = utilisateurIAMRepository;
    this.tokenAPIInformationRepository = tokenAPIInformationRepository;
  }

  async run(email: Utilisateur['email'], habilitations: Habilitations, profil: Profil | null): Promise<void> {
    const utilisateurASupprimer = await this.utilisateurRepository.récupérer(email);
    if (!utilisateurASupprimer) {
      throw new Error('Le compte à supprimer n’existe pas.');
    }
    
    const habilitationsUtilisateurASupprimer = utilisateurASupprimer.habilitations;
    const habilitation = new Habilitation(habilitations);
    habilitation.vérifierLesHabilitationsEnSuppressionUtilisateur(
      habilitationsUtilisateurASupprimer.lecture.chantiers,
      habilitationsUtilisateurASupprimer.lecture.territoires,
      profil,
    );

    await this.utilisateurRepository.desactiver(email);

    if (process.env.IMPORT_KEYCLOAK_URL) {
      await this.utilisateurIAMRepository.desactive(email);
    }
    await this.tokenAPIInformationRepository.supprimerTokenAPIInformation({ email });
  }
}
