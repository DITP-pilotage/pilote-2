import { mock, MockProxy } from "jest-mock-extended";
import { NouveauteRepository } from "@/server/parametrage-nouveautes/domain/ports/NouveauteRepository";
import { ListerNouveautesUseCase } from "@/server/parametrage-nouveautes/usecases/ListerNouveautesUseCase";
import { Nouveaute } from "@/server/parametrage-nouveautes/domain/Nouveaute";

describe("ListerNouveautesUseCase", () => {
  let listerNouveautesUseCase: ListerNouveautesUseCase;
  let nouveauteRepository: MockProxy<NouveauteRepository>;

  beforeEach(() => {
    nouveauteRepository = mock<NouveauteRepository>();
    listerNouveautesUseCase = new ListerNouveautesUseCase({
      nouveauteRepository,
    });
  });

  it("Doit lister les nouveautés", async () => {
    // Given
    const nouveautes = [
      Nouveaute.creerNouveaute({
        contenu: "Nouvelle nouveauté",
        version: "1.0.0",
        date: new Date().toISOString(),
      }),
      Nouveaute.creerNouveaute({
        contenu: "Nouvelle nouveauté 2",
        version: "1.0.1",
        date: new Date().toISOString(),
      }),
    ];
    nouveauteRepository.listerNouveautes.mockResolvedValue(nouveautes);

    // When
    const result = await listerNouveautesUseCase.execute();

    // Then
    expect(result).toEqual(nouveautes);
  });
});
