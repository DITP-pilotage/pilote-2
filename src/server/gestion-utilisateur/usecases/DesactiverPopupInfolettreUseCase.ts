import { UtilisateurRepository } from "@/server/gestion-utilisateur/domain/ports/UtilisateurRepository";

type Dependencies = {
  utilisateurRepository: UtilisateurRepository;
};

export class DesactiverPopupInfolettreUseCase {
  private readonly utilisateurRepository: UtilisateurRepository;

  constructor({ utilisateurRepository }: Dependencies) {
    this.utilisateurRepository = utilisateurRepository;
  }

  async execute(utilisateurId: string): Promise<void> {
    await this.utilisateurRepository.mettreAJourLaDateVisulationPopupInfolettre(
      utilisateurId,
      new Date(),
    );
  }
}
