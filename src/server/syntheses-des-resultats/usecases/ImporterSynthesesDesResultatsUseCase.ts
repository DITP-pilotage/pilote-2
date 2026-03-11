import { $Enums } from "@prisma/client";
import { randomUUID } from "node:crypto";
import SynthèseDesRésultatsRepository from "@/server/domain/chantier/synthèseDesRésultats/SynthèseDesRésultatsRepository.interface";
import { ImportSyntheseDesResultatsInput } from "@/validation/import-synthese-des-resultats";
import { SyntheseDesResultatsV2 } from "@/server/domain/chantier/synthèseDesRésultats/SynthèseDesRésultats.interface";
import { MétéoSaisissable } from "@/server/domain/météo/Météo.interface";
import type { Inject } from "@/server/syntheses-des-resultats/module";

export class ImporterSynthesesDesResultatsUseCase {
  private readonly synthèseDesRésultatsRepository: SynthèseDesRésultatsRepository;

  constructor({
    synthèseDesRésultatsRepository,
  }: Inject<"synthèseDesRésultatsRepository">) {
    this.synthèseDesRésultatsRepository = synthèseDesRésultatsRepository;
  }

  async execute({
    chantierId,
    syntheses,
    auteurId,
  }: {
    chantierId: string;
    syntheses: ImportSyntheseDesResultatsInput[];
    auteurId: string;
  }): Promise<void> {
    for (const synthese of syntheses) {
      const id = randomUUID();
      const date = synthese.date_synthese
        ? new Date(synthese.date_synthese)
        : new Date();

      const synthèseV2: SyntheseDesResultatsV2 = {
        chantierId,
        territoireCode: synthese.territoire,
        id,
        contenu: synthese.contenu,
        auteurCreationId: auteurId,
        auteurModificationId: auteurId,
        meteo: synthese.meteo as MétéoSaisissable,
        dateCreation: date.toISOString(),
        dateModification: date.toISOString(),
        statut: $Enums.statut_synthese_des_resultats.PUBLIE,
      };

      await this.synthèseDesRésultatsRepository.save(synthèseV2);
    }
  }
}
