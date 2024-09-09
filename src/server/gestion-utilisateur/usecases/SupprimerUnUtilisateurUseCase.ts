import UtilisateurRepository from '@/server/domain/utilisateur/UtilisateurRepository.interface';
import Utilisateur from '@/server/domain/utilisateur/Utilisateur.interface';
import { UtilisateurIAMRepository } from '@/server/domain/utilisateur/UtilisateurIAMRepository';
import Habilitation from '@/server/domain/utilisateur/habilitation/Habilitation';
import { Habilitations } from '@/server/domain/utilisateur/habilitation/Habilitation.interface';
import { Profil } from '@/server/domain/profil/Profil.interface';

export default class SupprimerUnUtilisateurUseCase {
  constructor(
    private readonly utilisateurRepository: UtilisateurRepository,
    private readonly utilisateurIAMRepository: UtilisateurIAMRepository,
  ) {}

  async run(email: Utilisateur['email'], habilitations: Habilitations, profil: Profil | null): Promise<void> {
    const utilisateurASupprimer = await this.utilisateurRepository.récupérer(email);
    if (!utilisateurASupprimer) 
      throw new Error('Le compte à supprimer n’existe pas.');
    
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
