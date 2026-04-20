import { ContactInfoLettresService } from "@/server/gestion-utilisateur/domain/ports/ContactInfoLettresService";
import type { Inject } from "@/server/gestion-utilisateur/module";

const TEMPLATE_ID_INSCRIPTION_INFOLETTRE = 20;

export class EnvoyerMailInscriptionInfolettreUseCase {
  private readonly contactInfoLettresService: ContactInfoLettresService;

  constructor({
    contactInfoLettresService,
  }: Inject<"contactInfoLettresService">) {
    this.contactInfoLettresService = contactInfoLettresService;
  }

  async execute(
    utilisateurEmail: string,
    lienConfirmationInscription: string,
  ): Promise<void> {
    const destinataire = { email: utilisateurEmail };
    const parametres = {
      lien_confirmation: lienConfirmationInscription,
    };
    await this.contactInfoLettresService.envoieUnEmail(
      [destinataire],
      TEMPLATE_ID_INSCRIPTION_INFOLETTRE,
      parametres,
    );
  }
}
