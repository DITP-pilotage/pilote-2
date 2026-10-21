import { PerimetreMinisteriel } from "@/server/gestion-utilisateur/domain/PerimetreMinisteriel";
import { PerimetreMinisterielRepository } from "@/server/gestion-utilisateur/domain/ports/PerimetreMinisterielRepository";
import type { Inject } from "@/server/gestion-utilisateur/module";

export default class RecupererPerimetresMinisterielsUseCase {
  private readonly perimetreMinisterielRepository: PerimetreMinisterielRepository;

  constructor({
    perimetreMinisterielRepository,
  }: Inject<"perimetreMinisterielRepository">) {
    this.perimetreMinisterielRepository = perimetreMinisterielRepository;
  }

  async run({
    perimetresMinisterielsIds,
  }: {
    perimetresMinisterielsIds: string[] | null;
  }): Promise<PerimetreMinisteriel[]> {
    return perimetresMinisterielsIds === null
      ? this.perimetreMinisterielRepository.listAll()
      : this.perimetreMinisterielRepository.list(perimetresMinisterielsIds);
  }
}
