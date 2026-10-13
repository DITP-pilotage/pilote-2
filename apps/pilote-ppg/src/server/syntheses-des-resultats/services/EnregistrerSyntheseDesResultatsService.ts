import { $Enums } from "@prisma/client";
import { SyntheseDesResultatsV2 } from "@/shared/chantier/syntheseDesResultats/SyntheseDesResultats.interface";
import { SyntheseDesResultatsRepository } from "@/server/syntheses-des-resultats/infrastructure/sql/SyntheseDesResultatsRepository.interface";
import { ChantierRepository } from "@/server/chantiers/domain/ports/ChantierRepository";
import { Transaction } from "@/server/framework/persistence/Transaction";

export class EnregistrerSyntheseDesResultatsService {
  constructor(
    private readonly dependencies: {
      synthèseDesRésultatsRepository: SyntheseDesResultatsRepository;
      chantierRepository: ChantierRepository;
      transaction: Transaction;
    },
  ) {}

  async enregistrer(synthese: SyntheseDesResultatsV2): Promise<void> {
    await this.dependencies.transaction.run(async () => {
      if (synthese.statut === $Enums.statut_publication.PUBLIE) {
        await this.dependencies.chantierRepository.modifierMeteo(
          synthese.chantierId,
          synthese.territoireCode,
          synthese.meteo,
        );
      }
      await this.dependencies.synthèseDesRésultatsRepository.save(synthese);
    });
  }
}
