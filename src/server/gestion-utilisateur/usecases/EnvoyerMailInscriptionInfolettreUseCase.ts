import { ContactInfoLettresService } from '@/server/gestion-utilisateur/domain/ports/ContactInfoLettresService';
import { UtilisateurRepository } from '@/server/gestion-utilisateur/domain/ports/UtilisateurRepository';

type Dependencies = {
  contactInfoLettresService: ContactInfoLettresService
  utilisateurRepository: UtilisateurRepository
};

export class EnvoyerMailInscriptionInfolettreUseCase {
  private readonly contactInfoLettresService: ContactInfoLettresService;

  private readonly utilisateurRepository: UtilisateurRepository;

  constructor({
    contactInfoLettresService,
    utilisateurRepository,
  }: Dependencies)  {
    this.contactInfoLettresService = contactInfoLettresService;
    this.utilisateurRepository = utilisateurRepository;
  }

  async execute(utilisateurEmail: string, lienConfirmationInscription: string): Promise<void> {
    await this.contactInfoLettresService.envoieUnEmail([{ email: utilisateurEmail }], 20, { lien_confirmation: lienConfirmationInscription });
  }
}
