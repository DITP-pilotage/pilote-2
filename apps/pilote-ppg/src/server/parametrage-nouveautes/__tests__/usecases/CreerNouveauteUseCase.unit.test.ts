import { MockProxy, mock } from "vitest-mock-extended";
import { CreerNouveauteUseCase } from "@/server/parametrage-nouveautes/usecases/CreerNouveauteUseCase";
import { NouveauteRepository } from "@/server/parametrage-nouveautes/domain/ports/NouveauteRepository";
import { BadRequestError } from "@/server/app/error-boundary/bad-request-error";

describe("CreerNouveauteUseCase", () => {
  let creerNouveauteUseCase: CreerNouveauteUseCase;
  let nouveauteRepository: MockProxy<NouveauteRepository>;

  beforeEach(() => {
    nouveauteRepository = mock<NouveauteRepository>();
    creerNouveauteUseCase = new CreerNouveauteUseCase({ nouveauteRepository });
  });

  it("Doit créer une nouveauté avec l'id fourni par le client", async () => {
    // Given
    const id = "550e8400-e29b-41d4-a716-446655440000";
    const version = "1.0.10";
    const date = new Date().toISOString();
    const contenu = "Nouvelle nouveauté";

    // When
    await creerNouveauteUseCase.execute({ id, version, date, contenu });

    // Then
    expect(nouveauteRepository.creerNouveaute).toHaveBeenCalledWith(
      expect.objectContaining({
        id,
        version,
        date,
        contenu,
      }),
    );
  });

  it("Doit lancer une erreur si la version n'est pas valide", async () => {
    // Given
    const id = "550e8400-e29b-41d4-a716-446655440000";
    const version = "1.a.0";
    const date = new Date().toISOString();
    const contenu = "Nouvelle nouveauté";

    // When
    await expect(
      creerNouveauteUseCase.execute({ id, version, date, contenu }),
    ).rejects.toThrow(BadRequestError);
  });

  it("Doit sanitizer le contenu avant de créer la nouveauté", async () => {
    // Given
    const id = "550e8400-e29b-41d4-a716-446655440000";
    const version = "1.0.0";
    const date = new Date().toISOString();
    const contenu = '<script>alert("XSS")</script>';

    // When
    await creerNouveauteUseCase.execute({ id, version, date, contenu });

    // Then
    expect(nouveauteRepository.creerNouveaute).toHaveBeenCalledWith(
      expect.objectContaining({
        contenu: "",
      }),
    );
  });
});
