import {
  AlbertAccessRepository,
  ProfilAccess,
} from "@/server/albert-access/domain/ports/AlbertAccessRepository";
import type { Inject } from "@/server/albert-access/module";

export class ListProfilsUseCase {
  private albertAccessRepository: AlbertAccessRepository;

  constructor({ albertAccessRepository }: Inject<"albertAccessRepository">) {
    this.albertAccessRepository = albertAccessRepository;
  }

  async execute(): Promise<ProfilAccess[]> {
    return this.albertAccessRepository.listProfils();
  }
}
