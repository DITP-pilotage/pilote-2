import { AlbertAccessRepository } from "@/server/albert-access/domain/ports/AlbertAccessRepository";
import {
  AlbertAccess,
  checkAlbertAccess,
} from "@/server/albert-access/domain/checkAlbertAccess";
import type { Inject } from "@/server/albert-access/module";
import type { RecupererToutesLesVariablesContenuUseCase } from "@/server/gestion-contenu/usecases/RecupererToutesLesVariablesContenuUseCase";

export class CheckAlbertAccessUseCase {
  private albertAccessRepository: AlbertAccessRepository;
  private recupererToutesLesVariablesContenuUseCase: RecupererToutesLesVariablesContenuUseCase;

  constructor({
    albertAccessRepository,
    recupererToutesLesVariablesContenuUseCase,
  }: Inject<
    "albertAccessRepository" | "recupererToutesLesVariablesContenuUseCase"
  >) {
    this.albertAccessRepository = albertAccessRepository;
    this.recupererToutesLesVariablesContenuUseCase =
      recupererToutesLesVariablesContenuUseCase;
  }

  async execute({
    utilisateurId,
    profil,
  }: {
    utilisateurId: string;
    profil: string | null;
  }): Promise<AlbertAccess> {
    const variables =
      await this.recupererToutesLesVariablesContenuUseCase.run();
    const flags = await this.albertAccessRepository.getAccessFlags(
      utilisateurId,
      profil,
    );
    return checkAlbertAccess({
      killSwitch: variables.NEXT_PUBLIC_FF_ASK_AI,
      profil,
      ...flags,
    });
  }
}
