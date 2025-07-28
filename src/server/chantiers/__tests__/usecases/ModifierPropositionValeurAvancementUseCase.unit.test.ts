import { mock, MockProxy } from "jest-mock-extended";
import { ModifierPropositionValeurAvancementUseCase } from "@/server/chantiers/usecases/ModifierPropositionValeurAvancementUseCase";
import { PropositionValeurAvancementRepository } from "@/server/chantiers/domain/ports/PropositionValeurAvancementRepository";
import { IndicateurRepository } from "@/server/chantiers/domain/ports/IndicateurRepository";

describe("ModifierPropositionValeurAvancementUseCase", () => {
  let propositionValeurAvancementRepository: MockProxy<PropositionValeurAvancementRepository>;
  let indicateurRepository: MockProxy<IndicateurRepository>;
  let modifierPropositionValeurAvancementUseCase: ModifierPropositionValeurAvancementUseCase;

  beforeEach(() => {
    propositionValeurAvancementRepository =
      mock<PropositionValeurAvancementRepository>();
    indicateurRepository = mock<IndicateurRepository>();
    modifierPropositionValeurAvancementUseCase =
      new ModifierPropositionValeurAvancementUseCase({
        propositionValeurAvancementRepository,
        indicateurRepository,
      });
  });

  it("doit créer une nouvelle proposition de valeur actuelle", async () => {
    // Given
    let indicId = "IND-001";
    let territoireCode = "DEPT-01";
    let auteurModification = "test@test.com";

    // When
    await modifierPropositionValeurAvancementUseCase.run({
      indicId,
      territoireCode,
      auteurModification,
    });
    // Then
    expect(
      propositionValeurAvancementRepository.supprimerPropositionValeurAvancement,
    ).toHaveBeenCalledTimes(1);
    expect(
      indicateurRepository.supprimerPropositionValeurAvancement,
    ).toHaveBeenCalledTimes(1);
  });
});
