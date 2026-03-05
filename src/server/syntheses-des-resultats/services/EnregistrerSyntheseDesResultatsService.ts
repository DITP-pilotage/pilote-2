import { SynthèseDesRésultatsV2 } from "@/server/domain/chantier/synthèseDesRésultats/SynthèseDesRésultats.interface";
import SynthèseDesRésultatsRepository from "@/server/domain/chantier/synthèseDesRésultats/SynthèseDesRésultatsRepository.interface";
import { ChantierRepository } from "@/server/chantiers/domain/ports/ChantierRepository";
import { Transaction } from "@/server/db/Transaction";

export class EnregistrerSyntheseDesResultatsService {
  constructor(
    private readonly dependencies: {
      synthèseDesRésultatsRepository: SynthèseDesRésultatsRepository;
      chantierRepository: ChantierRepository;
      transaction: Transaction;
    },
  ) {}

  async enregistrer(synthese: SynthèseDesRésultatsV2): Promise<void> {
    await this.dependencies.transaction.run(async () => {
      await this.dependencies.chantierRepository.modifierMeteo(
        synthese.chantierId,
        synthese.territoireCode,
        synthese.meteo,
      );
      await this.dependencies.synthèseDesRésultatsRepository.save(synthese);
    });
  }
}
