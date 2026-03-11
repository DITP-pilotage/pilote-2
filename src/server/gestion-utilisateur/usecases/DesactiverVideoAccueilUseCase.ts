import { UtilisateurRepository } from "@/server/gestion-utilisateur/domain/ports/UtilisateurRepository";
import type { Inject } from "@/server/gestion-utilisateur/module";

export class DesactiverVideoAccueilUseCase {
  private readonly utilisateurRepository: UtilisateurRepository;

  constructor({ utilisateurRepository }: Inject<"utilisateurRepository">) {
    this.utilisateurRepository = utilisateurRepository;
  }

  async execute(utilisateurId: string): Promise<void> {
    await this.utilisateurRepository.desactiverVideoAccueil(
      utilisateurId,
      new Date(),
    );
  }
}
