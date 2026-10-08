import { SyntheseDesResultatsRepository } from "@/server/fiche-conducteur/domain/ports/SyntheseDesResultatsRepository";
import { SyntheseDesResultats } from "@/server/fiche-conducteur/domain/SyntheseDesResultats";
import type { Inject } from "@/server/fiche-conducteur/module";

export class RecupererDerniereSyntheseDesResultatsUseCase {
  private synthèseDesRésultatsRepository: SyntheseDesResultatsRepository;

  constructor({
    synthèseDesRésultatsRepository,
  }: Inject<"synthèseDesRésultatsRepository">) {
    this.synthèseDesRésultatsRepository = synthèseDesRésultatsRepository;
  }

  async run({
    chantierId,
  }: {
    chantierId: string;
  }): Promise<SyntheseDesResultats | null> {
    return this.synthèseDesRésultatsRepository.recupererLaPlusRecenteMailleNatParChantierId(
      chantierId,
    );
  }
}
