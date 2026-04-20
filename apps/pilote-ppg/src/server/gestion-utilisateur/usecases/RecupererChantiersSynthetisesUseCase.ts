import { ChantierSynthétisé } from "@/server/domain/chantier/Chantier.interface";
import { ChantierRepository } from "@/server/gestion-utilisateur/domain/ports/ChantierRepository";
import type { Inject } from "@/server/gestion-utilisateur/module";

export class RecupererChantiersSynthetisesUseCase {
  private chantierRepository: ChantierRepository;

  constructor({ chantierRepository }: Inject<"chantierRepository">) {
    this.chantierRepository = chantierRepository;
  }

  async run({
    listeChantierIdLecture,
  }: {
    listeChantierIdLecture: string[];
  }): Promise<ChantierSynthétisé[]> {
    return this.chantierRepository.récupérerChantiersSynthétisés({
      listeChantierIdLecture,
    });
  }
}
