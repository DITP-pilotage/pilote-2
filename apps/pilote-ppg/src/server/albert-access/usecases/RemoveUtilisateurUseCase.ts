import { AlbertAccessRepository } from "@/server/albert-access/domain/ports/AlbertAccessRepository";
import type { Inject } from "@/server/albert-access/module";

export class RemoveUtilisateurUseCase {
  private albertAccessRepository: AlbertAccessRepository;

  constructor({ albertAccessRepository }: Inject<"albertAccessRepository">) {
    this.albertAccessRepository = albertAccessRepository;
  }

  async execute({ utilisateurId }: { utilisateurId: string }): Promise<void> {
    await this.albertAccessRepository.removeUtilisateur(utilisateurId);
  }
}
