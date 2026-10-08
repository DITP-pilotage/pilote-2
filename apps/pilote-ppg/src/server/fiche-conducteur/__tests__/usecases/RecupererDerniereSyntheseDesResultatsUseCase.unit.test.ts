import { mock, MockProxy } from "vitest-mock-extended";
import { SyntheseDesResultatsRepository } from "@/server/fiche-conducteur/domain/ports/SyntheseDesResultatsRepository";
import { SyntheseDesResultatsBuilder } from "@/server/fiche-conducteur/app/builders/SyntheseDesResultatsBuilder";
import { RecupererDerniereSyntheseDesResultatsUseCase } from "@/server/fiche-conducteur/usecases/RecupererDerniereSyntheseDesResultatsUseCase";

describe("RecupererDerniereSyntheseDesResultatsUseCase", () => {
  let récupérerDernièreSynthèseDesRésultatsUseCase: RecupererDerniereSyntheseDesResultatsUseCase;
  let synthèseDesRésultatsRepository: MockProxy<SyntheseDesResultatsRepository>;

  beforeEach(() => {
    synthèseDesRésultatsRepository = mock<SyntheseDesResultatsRepository>();
    récupérerDernièreSynthèseDesRésultatsUseCase =
      new RecupererDerniereSyntheseDesResultatsUseCase({
        synthèseDesRésultatsRepository,
      });
  });

  it("doit remonter la dernière synthèse des résultats", async () => {
    // Given
    const chantierId = "CH-168";
    const synthèseDesRésultats = new SyntheseDesResultatsBuilder()
      .withMeteo("SOLEIL")
      .withCommentaire("Un super commentaire")
      .build();
    synthèseDesRésultatsRepository.recupererLaPlusRecenteMailleNatParChantierId.mockResolvedValue(
      synthèseDesRésultats,
    );

    // When
    const synthèseDesRésultatsResult =
      await récupérerDernièreSynthèseDesRésultatsUseCase.run({ chantierId });

    // Then
    expect(synthèseDesRésultatsResult?.meteo).toEqual("SOLEIL");
    expect(synthèseDesRésultatsResult?.commentaire).toEqual(
      "Un super commentaire",
    );
  });
});
