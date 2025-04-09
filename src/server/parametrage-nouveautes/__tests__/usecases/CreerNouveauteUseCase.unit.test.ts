import { CreerNouveauteUseCase } from "@/server/parametrage-nouveautes/usecases/CreerNouveauteUseCase";
import { NouveauteRepository } from "@/server/parametrage-nouveautes/domain/ports/NouveauteRepository";
import { MockProxy, mock } from "jest-mock-extended";
import { BadRequestError } from "@/server/app/error-boundary/bad-request-error";

describe('CreerNouveauteUseCase', () => {
  let creerNouveauteUseCase: CreerNouveauteUseCase;
  let nouveauteRepository: MockProxy<NouveauteRepository>;

  beforeEach(() => {
    nouveauteRepository = mock<NouveauteRepository>();
    creerNouveauteUseCase = new CreerNouveauteUseCase({ nouveauteRepository });
  });

  it('Doit créer une nouveauté', async () => {
    // Given
    const version = '1.0.10';
    const date = new Date().toISOString();
    const contenu = 'Nouvelle nouveauté';

    // When
    await creerNouveauteUseCase.execute({ version, date, contenu });

    // Then
    expect(nouveauteRepository.creerNouveaute).toHaveBeenCalledWith(expect.objectContaining({
      version,
      date,
      contenu,
    }));
  });

  it('Doit lancer une erreur si la version n\'est pas valide', async () => {
    // Given
    const version = '1.a.0';
    const date = new Date().toISOString();
    const contenu = 'Nouvelle nouveauté';

    // When
    await expect(creerNouveauteUseCase.execute({ version, date, contenu })).rejects.toThrow(BadRequestError);
  });

  it('Doit lancer une erreur si le contenu n\'est pas valide', async () => {
    // Given
    const version = '1.0.0';
    const date = new Date().toISOString();
    const contenu = '<script>alert("XSS")</script>';

    // When
    await expect(creerNouveauteUseCase.execute({ version, date, contenu })).rejects.toThrow(BadRequestError);
  });
});
