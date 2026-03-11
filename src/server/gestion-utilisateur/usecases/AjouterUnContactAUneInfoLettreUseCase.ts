import { ContactInfoLettresService } from "@/server/gestion-utilisateur/domain/ports/ContactInfoLettresService";
import { UtilisateurRepository } from "@/server/gestion-utilisateur/domain/ports/UtilisateurRepository";
import type { Inject } from "@/server/gestion-utilisateur/module";

export class AjouterUnContactAUneInfoLettreUseCase {
  private readonly contactInfoLettresService: ContactInfoLettresService;

  private readonly utilisateurRepository: UtilisateurRepository;

  constructor({
    contactInfoLettresService,
    utilisateurRepository,
  }: Inject<"contactInfoLettresService" | "utilisateurRepository">) {
    this.contactInfoLettresService = contactInfoLettresService;
    this.utilisateurRepository = utilisateurRepository;
  }

  async execute(utilisateurId: string, infolettreId: number): Promise<boolean> {
    const utilisateurEmail =
      await this.utilisateurRepository.recupererUtilisateurEmail(utilisateurId);

    if (!utilisateurEmail) {
      return false;
    }

    try {
      await this.contactInfoLettresService.ajouterContactAUneInfoLettre(
        utilisateurEmail,
        [infolettreId],
      );
    } catch {
      return false;
    }

    await this.utilisateurRepository.mettreAJourLaDateInscriptionInfolettre(
      utilisateurEmail,
      new Date(),
    );
    return true;
  }
}
