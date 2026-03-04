import { $Enums } from "@prisma/client";
import { randomUUID } from "node:crypto";
import SynthèseDesRésultatsRepository from "@/server/domain/chantier/synthèseDesRésultats/SynthèseDesRésultatsRepository.interface";
import { Météo } from "@/server/domain/météo/Météo.interface";
import { ChantierRepository } from "@/server/chantiers/domain/ports/ChantierRepository";
import Habilitation from "@/server/domain/utilisateur/habilitation/Habilitation";
import { Habilitations } from "@/server/domain/utilisateur/habilitation/Habilitation.interface";
import { Transaction } from "@/server/db/Transaction";

export class CreerUneSyntheseDesResultatsUseCase {
  constructor(
    private readonly dependencies: {
      synthèseDesRésultatsRepository: SynthèseDesRésultatsRepository;
      chantierRepository: ChantierRepository;
      transaction: Transaction;
    },
  ) {}

  async execute({
    chantierId,
    territoireCode,
    contenu,
    météo,
    auteur_id,
    date_creation,
    statut,
    habilitations,
  }: {
    chantierId: string;
    territoireCode: string;
    contenu: string;
    météo: Météo;
    auteur_id: string;
    date_creation: string;
    statut: $Enums.statut_synthese_des_resultats;
    habilitations: Habilitations;
  }): Promise<void> {
    const habilitation = new Habilitation(habilitations);
    habilitation.vérifierLesHabilitationsEnSaisieDesPublications(
      chantierId,
      territoireCode,
    );

    await this.dependencies.transaction.run(async () => {
      await this.dependencies.chantierRepository.modifierMeteo(
        chantierId,
        territoireCode,
        météo,
      );
      await this.dependencies.synthèseDesRésultatsRepository.save({
        id: randomUUID(),
        chantierId,
        territoireCode,
        contenu,
        météo,
        auteur_creation_id: auteur_id,
        date_creation,
        auteur_modification_id: auteur_id,
        date_modification: date_creation,
        statut,
      });
    });
  }
}
