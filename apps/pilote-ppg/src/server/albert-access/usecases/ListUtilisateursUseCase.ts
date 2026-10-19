import {
  AlbertAccessRepository,
  UtilisateurAccess,
} from "@/server/albert-access/domain/ports/AlbertAccessRepository";
import type { Inject } from "@/server/albert-access/module";

export class ListUtilisateursUseCase {
  private albertAccessRepository: AlbertAccessRepository;

  constructor({ albertAccessRepository }: Inject<"albertAccessRepository">) {
    this.albertAccessRepository = albertAccessRepository;
  }

  async execute(): Promise<UtilisateurAccess[]> {
    return this.albertAccessRepository.listUtilisateurs();
  }
}
