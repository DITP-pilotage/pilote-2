import { AlbertAccessRepository } from "@/server/albert-access/domain/ports/AlbertAccessRepository";
import type { Inject } from "@/server/albert-access/module";
import { BadRequestError } from "@/shared/errors/bad-request-error";
import { NotFoundError } from "@/shared/errors/not-found-error";
import { ProfilEnum } from "@/shared/profil/ProfilEnum";

const PROFIL_CODES: ReadonlySet<string> = new Set(Object.values(ProfilEnum));

export class SetProfilActiveUseCase {
  private albertAccessRepository: AlbertAccessRepository;

  constructor({ albertAccessRepository }: Inject<"albertAccessRepository">) {
    this.albertAccessRepository = albertAccessRepository;
  }

  async execute({
    profilCode,
    active,
  }: {
    profilCode: string;
    active: boolean;
  }): Promise<void> {
    if (!PROFIL_CODES.has(profilCode)) {
      throw new NotFoundError("Profil inconnu");
    }
    if (profilCode === ProfilEnum.DITP_ADMIN) {
      throw new BadRequestError(
        "Les administrateurs DITP ont toujours accès à l'assistant IA",
      );
    }
    await this.albertAccessRepository.setProfilActive(profilCode, active);
  }
}
