import { UtilisateurRepository } from "@/server/gestion-utilisateur/domain/ports/UtilisateurRepository";

type Dependencies = {
  utilisateurRepository: UtilisateurRepository;
};

export class RecupererEtatVisualisationVideoAccueilUseCase {
  private readonly utilisateurRepository: UtilisateurRepository;

  constructor({ utilisateurRepository }: Dependencies) {
    this.utilisateurRepository = utilisateurRepository;
  }

  async execute(utilisateurId: string): Promise<boolean> {
    return this.utilisateurRepository.recupererEtatVisualisationVideoAccueil(
      utilisateurId,
    );
  }
}
