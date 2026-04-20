import { SynthèseDesRésultatsRepository } from "@/server/fiche-conducteur/domain/ports/SynthèseDesRésultatsRepository";
import { SyntheseDesResultats } from "@/server/fiche-conducteur/domain/SyntheseDesResultats";
import type { Inject } from "@/server/fiche-conducteur/module";

export class RécupérerDernièreSynthèseDesRésultatsUseCase {
  private synthèseDesRésultatsRepository: SynthèseDesRésultatsRepository;

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
