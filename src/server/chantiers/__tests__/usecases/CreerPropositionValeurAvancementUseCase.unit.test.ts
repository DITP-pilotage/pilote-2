import { captor, mock, MockProxy } from "jest-mock-extended";
import { CreerPropositionValeurAvancementUseCase } from "@/server/chantiers/usecases/CreerPropositionValeurAvancementUseCase";
import { PropositionValeurAvancementRepository } from "@/server/chantiers/domain/ports/PropositionValeurAvancementRepository";
import { PropositionValeurAvancement } from "@/server/chantiers/domain/PropositionValeurAvancement";
import { StatutProposition } from "@/server/chantiers/domain/StatutProposition";

describe("CreerPropositionValeurAvancementUseCase", () => {
  let propositionValeurAvancementRepository: MockProxy<PropositionValeurAvancementRepository>;
  let creerPropositionValeurAvancementUseCase: CreerPropositionValeurAvancementUseCase;

  beforeEach(() => {
    propositionValeurAvancementRepository =
      mock<PropositionValeurAvancementRepository>();
    creerPropositionValeurAvancementUseCase =
      new CreerPropositionValeurAvancementUseCase({
        propositionValeurAvancementRepository,
      });
  });

  it("doit créer une nouvelle proposition de valeur avancement", async () => {
    // Given
    let indicId = "IND-001";
    let valeurAvancementProposee = 12.3;
    let territoireCode = "DEPT-01";
    let dateValeurAvancement = new Date("2023-01-17");
    let idAuteurModification = "642cfa5a-9438-4c77-8626-6cc9e63d1f92";
    let auteurModification = "test@test.com";
    let dateProposition = new Date("2023-01-20");
    let motifProposition = "Un motif";
    let sourceDonneeEtMethodeCalcul = "une source de donnee et une methode";
    let statut = StatutProposition.EN_COURS;

    // When
    await creerPropositionValeurAvancementUseCase.run({
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
    // Then
    const propositionValeurAvancementCaptor =
      captor<PropositionValeurAvancement>();
    expect(
      propositionValeurAvancementRepository.annulePropositionValeurAvancementPrecedente,
    ).toHaveBeenCalledWith({ indicId, territoireCode });
    expect(
      propositionValeurAvancementRepository.creerPropositionValeurAvancement,
    ).toHaveBeenNthCalledWith(1, propositionValeurAvancementCaptor);
  });
});
