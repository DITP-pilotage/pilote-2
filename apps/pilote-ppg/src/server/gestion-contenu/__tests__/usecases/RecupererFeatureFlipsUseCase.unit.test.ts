import { mock, MockProxy } from "vitest-mock-extended";
import { GestionContenuRepository } from "@/server/gestion-contenu/domain/ports/GestionContenuRepository";
import { RecupererFeatureFlipsUseCase } from "@/server/gestion-contenu/usecases/RecupererFeatureFlipsUseCase";

vi.mock("@/config", () => ({
  configuration: vi.fn(),
}));

import { configuration } from "@/config";

describe("RecupererFeatureFlipsUseCase", () => {
  let recupererFeatureFlipsUseCase: RecupererFeatureFlipsUseCase;
  let gestionContenuRepository: MockProxy<GestionContenuRepository>;

  beforeEach(() => {
    gestionContenuRepository = mock<GestionContenuRepository>();
    recupererFeatureFlipsUseCase = new RecupererFeatureFlipsUseCase({
      gestionContenuRepository,
    });
  });

  it("doit construire les valeurs depuis la config quand featureFlipAdmin est désactivé", async () => {
    // Given
    vi.mocked(configuration).mockReturnValue({
      featureFlip: {
        featureFlipAdmin: false,
        applicationIndisponible: false,
        ppgArchive: false,
        poserUneQuestionIndicateur: false,
        askAI: false,
        piloteEval: false,
        rapportCoordinateurs: true,
        rapportPva: true,
        creationCompteArs: false,
        masquerIndicateursNonApplicables: false,
        accesPilote: false,
        comparaisonTerritoires: false,
        pvaValeurDifferente: false,
        lienContactBrevo: false,
      },
    } as ReturnType<typeof configuration>);

    // When
    const result = await recupererFeatureFlipsUseCase.run();

    // Then
    expect(result.NEXT_PUBLIC_FF_RAPPORT_PVA).toBe(true);
    expect(result.NEXT_PUBLIC_FF_RAPPORT_COORDINATEURS).toBe(true);
    expect(result.NEXT_PUBLIC_FF_APPLICATION_INDISPONIBLE).toBe(false);
    expect(
      gestionContenuRepository.recupererMapVariableContenuParListeDeNom,
    ).not.toHaveBeenCalled();
  });

  it("doit fusionner les overrides DB quand featureFlipAdmin est activé", async () => {
    // Given
    vi.mocked(configuration).mockReturnValue({
      featureFlip: {
        featureFlipAdmin: true,
        applicationIndisponible: false,
        ppgArchive: false,
        poserUneQuestionIndicateur: false,
        askAI: false,
        piloteEval: false,
        rapportCoordinateurs: true,
        rapportPva: true,
        creationCompteArs: false,
        masquerIndicateursNonApplicables: false,
        accesPilote: false,
        comparaisonTerritoires: false,
        pvaValeurDifferente: false,
        lienContactBrevo: false,
      },
    } as ReturnType<typeof configuration>);

    // DB override : rapportCoordinateurs passe à false, applicationIndisponible passe à true
    gestionContenuRepository.recupererMapVariableContenuParListeDeNom.mockResolvedValue(
      {
        NEXT_PUBLIC_FF_RAPPORT_COORDINATEURS: false,
        NEXT_PUBLIC_FF_APPLICATION_INDISPONIBLE: true,
      },
    );

    // When
    const result = await recupererFeatureFlipsUseCase.run();

    // Then
    expect(result.NEXT_PUBLIC_FF_RAPPORT_COORDINATEURS).toBe(false);
    expect(result.NEXT_PUBLIC_FF_APPLICATION_INDISPONIBLE).toBe(true);
    expect(result.NEXT_PUBLIC_FF_RAPPORT_PVA).toBe(true);
  });
});
