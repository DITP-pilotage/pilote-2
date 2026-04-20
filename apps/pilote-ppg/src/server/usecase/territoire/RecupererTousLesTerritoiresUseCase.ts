import { TerritoireRepository } from "@/server/gestion-utilisateur/domain/ports/TerritoireRepository";
import { Territoire } from "@/server/gestion-utilisateur/domain/Territoire";

interface Dependencies {
  territoireRepository: TerritoireRepository;
}

export class RecupererTousLesTerritoiresUseCase {
  private territoireRepository: TerritoireRepository;

  constructor({ territoireRepository }: Dependencies) {
    this.territoireRepository = territoireRepository;
  }

  async run(): Promise<Territoire[]> {
    return this.territoireRepository.lister([]);
  }
}
