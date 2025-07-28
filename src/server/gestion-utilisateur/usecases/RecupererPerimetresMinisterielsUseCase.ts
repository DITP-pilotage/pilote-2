import { PerimetreMinisteriel } from "@/server/gestion-utilisateur/domain/PerimetreMinisteriel";
import { PerimetreMinisterielRepository } from "@/server/gestion-utilisateur/domain/ports/PerimetreMinisterielRepository";

interface Dependencies {
  perimetreMinisterielRepository: PerimetreMinisterielRepository;
}

export default class RecupererPerimetresMinisterielsUseCase {
  private readonly perimetreMinisterielRepository: PerimetreMinisterielRepository;

  constructor({ perimetreMinisterielRepository }: Dependencies) {
    this.perimetreMinisterielRepository = perimetreMinisterielRepository;
  }

  async run({
    perimetresMinisterielsIds,
  }: {
    perimetresMinisterielsIds: string[];
  }): Promise<PerimetreMinisteriel[]> {
    return this.perimetreMinisterielRepository.lister(
      perimetresMinisterielsIds,
    );
  }
}
