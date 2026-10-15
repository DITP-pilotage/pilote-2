import type { Inject } from "@/server/albert-access/module";
import { CheckAlbertAccessUseCase } from "@/server/albert-access/usecases/CheckAlbertAccessUseCase";
import { ForbiddenError } from "@/shared/errors/forbidden-error";

export class AssertAlbertAccessUseCase {
  private checkAlbertAccessUseCase: CheckAlbertAccessUseCase;

  constructor({
    checkAlbertAccessUseCase,
  }: Inject<"checkAlbertAccessUseCase">) {
    this.checkAlbertAccessUseCase = checkAlbertAccessUseCase;
  }

  async execute(params: {
    utilisateurId: string;
    profil: string | null;
  }): Promise<void> {
    const { peutUtiliser } =
      await this.checkAlbertAccessUseCase.execute(params);
    if (!peutUtiliser) {
      throw new ForbiddenError("Accès à l'assistant IA non autorisé");
    }
  }
}
