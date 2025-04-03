import { UtilisateurRepository } from '@/server/domain/utilisateur/UtilisateurRepository.interface';
import { UtilisateurIAMRepository } from '@/server/domain/utilisateur/UtilisateurIAMRepository';
import { Habilitation } from '@/server/gestion-utilisateur/domain/habilitation/Habilitation';
import { Habilitations } from '@/server/gestion-utilisateur/domain/habilitation/Habilitation.interface';
import { Profil } from '@/server/gestion-utilisateur/domain/Profil';
import { Utilisateur } from '@/server/gestion-utilisateur/domain/Utilisateur';

type Dependencies = {
  utilisateurRepository: UtilisateurRepository;
  utilisateurIAMRepository: UtilisateurIAMRepository;
};

export class SupprimerUnUtilisateurUseCase {
  private readonly utilisateurRepository: UtilisateurRepository;

  private readonly utilisateurIAMRepository: UtilisateurIAMRepository;

  constructor({ utilisateurRepository, utilisateurIAMRepository }: Dependencies) {
    this.utilisateurRepository = utilisateurRepository;
    this.utilisateurIAMRepository = utilisateurIAMRepository;
  }

  async run(email: Utilisateur['email'], habilitations: Habilitations, profil: Profil | null): Promise<void> {
    const utilisateurASupprimer = await this.utilisateurRepository.récupérer(email);
    if (!utilisateurASupprimer) {
      throw new Error("Le compte à supprimer n'existe pas.");
    }
    
    const habilitationsUtilisateurASupprimer = utilisateurASupprimer.habilitations;
    const habilitation = new Habilitation(habilitations);
    habilitation.vérifierLesHabilitationsEnSuppressionUtilisateur(
      habilitationsUtilisateurASupprimer.lecture.chantiers,
      habilitationsUtilisateurASupprimer.lecture.territoires,
      profil,
    );

    await this.utilisateurRepository.supprimer(email);

    if (process.env.IMPORT_KEYCLOAK_URL) {
      await this.utilisateurIAMRepository.supprime(email);
    }
  }
}
