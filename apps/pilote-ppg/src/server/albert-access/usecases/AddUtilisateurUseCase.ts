import { AlbertAccessRepository } from "@/server/albert-access/domain/ports/AlbertAccessRepository";
import type { Inject } from "@/server/albert-access/module";
import { BadRequestError } from "@/shared/errors/bad-request-error";
import { NotFoundError } from "@/shared/errors/not-found-error";
import { ProfilEnum } from "@/shared/profil/ProfilEnum";

export class AddUtilisateurUseCase {
  private albertAccessRepository: AlbertAccessRepository;

  constructor({ albertAccessRepository }: Inject<"albertAccessRepository">) {
    this.albertAccessRepository = albertAccessRepository;
  }

  async execute({ utilisateurId }: { utilisateurId: string }): Promise<void> {
    const profil =
      await this.albertAccessRepository.findUtilisateurProfil(utilisateurId);
    if (profil === null) {
      throw new NotFoundError("Aucun utilisateur Pilote ne correspond");
    }
    if (profil === ProfilEnum.DITP_ADMIN) {
      throw new BadRequestError(
        "Les administrateurs DITP ont toujours accès à l'assistant IA",
      );
    }
    await this.albertAccessRepository.addUtilisateur(utilisateurId);
  }
}
