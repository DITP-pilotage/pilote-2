import { PropositionValeurAvancementRepository } from "@/server/chantiers/domain/ports/PropositionValeurAvancementRepository";
import { PropositionValeurAvancement } from "@/server/chantiers/domain/PropositionValeurAvancement";
import { StatutProposition } from "@/server/chantiers/domain/StatutProposition";

interface Dependencies {
  propositionValeurAvancementRepository: PropositionValeurAvancementRepository;
}

export class CreerPropositionValeurAvancementUseCase {
  private propositionValeurAvancementRepository: PropositionValeurAvancementRepository;

  constructor({ propositionValeurAvancementRepository }: Dependencies) {
    this.propositionValeurAvancementRepository =
      propositionValeurAvancementRepository;
  }

  async run({
    indicId,
    valeurAvancementProposee,
    territoireCode,
    dateValeurAvancement,
    idAuteurModification,
    auteurModification,
    dateProposition,
    motifProposition,
    sourceDonneeEtMethodeCalcul,
    statut,
  }: {
    indicId: string;
    valeurAvancementProposee: number;
    territoireCode: string;
    dateValeurAvancement: Date;
    idAuteurModification: string;
    auteurModification: string;
    dateProposition: Date;
    motifProposition: string;
    sourceDonneeEtMethodeCalcul: string;
    statut: StatutProposition;
  }) {
    await this.propositionValeurAvancementRepository.annulePropositionValeurAvancementPrecedente(
      { indicId, territoireCode },
    );

    const propositionValeurAvancement =
      PropositionValeurAvancement.creerPropositionValeurAvancement({
        indicId,
        valeurAvancementProposee,
        territoireCode,
        dateValeurAvancement,
        idAuteurModification,
        auteurModification,
        dateProposition,
        motifProposition,
        sourceDonneeEtMethodeCalcul,
        statut,
      });
    await this.propositionValeurAvancementRepository.creerPropositionValeurAvancement(
      propositionValeurAvancement,
    );
  }
}
