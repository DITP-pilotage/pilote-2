import { NouveauteRepository } from "@/server/parametrage-nouveautes/domain/ports/NouveauteRepository";
import { MockProxy, mock } from "jest-mock-extended";
import { ModifierNouveauteUseCase } from "@/server/parametrage-nouveautes/usecases/ModifierNouveauteUseCase";
import { BadRequestError } from "@/server/app/error-boundary/bad-request-error";

describe('ModifierNouveauteUseCase', () => {
  let modifierNouveauteUseCase: ModifierNouveauteUseCase;
  let nouveauteRepository: MockProxy<NouveauteRepository>;

  beforeEach(() => {
    nouveauteRepository = mock<NouveauteRepository>();
    modifierNouveauteUseCase = new ModifierNouveauteUseCase({ nouveauteRepository });
  });

  it('Doit modifier une nouveauté', async () => {
    // Given
    const id = '123';
    const version = '1.0.10';
    const date = new Date().toISOString();
    const contenu = 'Nouvelle nouveauté';

    // When
    await modifierNouveauteUseCase.execute({ id, version, date, contenu });

    // Then
    expect(nouveauteRepository.modifier).toHaveBeenCalledWith(expect.objectContaining({
      id,
      version,
      date,
      contenu,
    }));
  });

  it('Doit lancer une erreur si la version n\'est pas valide', async () => {
    // Given
    const id = '123';
    const version = '1.a.0';
    const date = new Date().toISOString();
    const contenu = 'Nouvelle nouveauté';

    // When
    await expect(modifierNouveauteUseCase.execute({ id, version, date, contenu })).rejects.toThrow(BadRequestError);
  });

  it('Doit lancer une erreur si le contenu n\'est pas valide', async () => {
    // Given
    const id = '123';
    const version = '1.0.0';
    const date = new Date().toISOString();
    const contenu = '<script>alert("XSS")</script>';

    // When
    await expect(modifierNouveauteUseCase.execute({ id, version, date, contenu })).rejects.toThrow(BadRequestError);
  });
});