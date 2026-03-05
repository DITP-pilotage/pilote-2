import { $Enums } from "@prisma/client";
import SynthèseDesRésultatsRepository from "@/server/domain/chantier/synthèseDesRésultats/SynthèseDesRésultatsRepository.interface";
import { SynthèseDesRésultatsV2 } from "@/server/domain/chantier/synthèseDesRésultats/SynthèseDesRésultats.interface";
import { Météo } from "@/server/domain/météo/Météo.interface";
import { ChantierRepository } from "@/server/chantiers/domain/ports/ChantierRepository";
import Habilitation from "@/server/domain/utilisateur/habilitation/Habilitation";
import { Habilitations } from "@/server/domain/utilisateur/habilitation/Habilitation.interface";
import { Transaction } from "@/server/db/Transaction";

export class ModifierUneSyntheseDesResultatsUseCase {
  constructor(
    private readonly dependencies: {
      synthèseDesRésultatsRepository: SynthèseDesRésultatsRepository;
      chantierRepository: ChantierRepository;
      transaction: Transaction;
    },
  ) {}

  async execute({
    syntheseAModifier,
    contenu,
    météo,
    auteur_modification_id,
    date_modification,
    habilitations,
    statut = $Enums.statut_synthese_des_resultats.PUBLIE,
  }: {
    syntheseAModifier: SynthèseDesRésultatsV2;
    contenu: string;
    météo: Météo;
    auteur_modification_id: string;
    date_modification: string;
    habilitations: Habilitations;
    statut?: $Enums.statut_synthese_des_resultats;
  }): Promise<void> {
    const habilitation = new Habilitation(habilitations);
    habilitation.vérifierLesHabilitationsEnSaisieDesPublications(
      syntheseAModifier.chantierId,
      syntheseAModifier.territoireCode,
    );

    await this.dependencies.transaction.run(async () => {
      await this.dependencies.chantierRepository.modifierMeteo(
        syntheseAModifier.chantierId,
        syntheseAModifier.territoireCode,
        météo,
      );
      await this.dependencies.synthèseDesRésultatsRepository.save({
        ...syntheseAModifier,
        contenu,
        météo,
        auteur_modification_id,
        date_modification,
        statut,
      });
    });
  }
}
