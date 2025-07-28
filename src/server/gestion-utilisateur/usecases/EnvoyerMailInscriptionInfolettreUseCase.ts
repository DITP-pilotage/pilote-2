import { ContactInfoLettresService } from '@/server/gestion-utilisateur/domain/ports/ContactInfoLettresService';

type Dependencies = {
  contactInfoLettresService: ContactInfoLettresService
};

const TEMPLATE_ID_INSCRIPTION_INFOLETTRE = 20;

export class EnvoyerMailInscriptionInfolettreUseCase {
  private readonly contactInfoLettresService: ContactInfoLettresService;

  constructor({
    contactInfoLettresService,
  }: Dependencies)  {
    this.contactInfoLettresService = contactInfoLettresService;
  }

  async execute(utilisateurEmail: string, lienConfirmationInscription: string): Promise<void> {
    const destinataire = { email: utilisateurEmail };
    const parametres = {
      lien_confirmation: lienConfirmationInscription,
    };
    await this.contactInfoLettresService.envoieUnEmail([destinataire], TEMPLATE_ID_INSCRIPTION_INFOLETTRE, parametres);
  }
}
