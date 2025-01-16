import UtilisateurRepository from '@/server/gestion-utilisateur/domain/ports/UtilisateurRepository.interface';
import { UtilisateurIAMRepository } from '@/server/gestion-utilisateur/domain/ports/UtilisateurIAMRepository';
import Utilisateur from '@/server/gestion-utilisateur/domain/Utilisateur.interface';
import { TokenAPIInformationRepository } from '@/server/gestion-utilisateur/domain/ports/TokenAPIInformationRepository';
import { Habilitations } from '@/server/gestion-utilisateur/domain/habilitation/Habilitation.interface';
import Habilitation from '@/server/gestion-utilisateur/domain/habilitation/Habilitation';
import { Profil } from '@/server/domain/profil/Profil.interface';

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

  async run(email: Utilisateur['email'], habilitations: Habilitations, profilAuteur: Profil | null): Promise<void> {
    const utilisateurAReactiver = await this.utilisateurRepository.récupérer(email);
    if (!utilisateurAReactiver) {
      throw new Error('Le compte à supprimer n’existe pas.');
    }

    const habilitation = new Habilitation(habilitations);
    habilitation.vérifierLesHabilitationsEnCréationModificationUtilisateur(
      utilisateurAReactiver.habilitations.lecture.chantiers, 
      utilisateurAReactiver.habilitations.lecture.territoires,
      profilAuteur,
    );


    await this.utilisateurRepository.reactiver(email);

    if (process.env.IMPORT_KEYCLOAK_URL) {
      await this.utilisateurIAMRepository.reactive(email);
    }
  }
}
