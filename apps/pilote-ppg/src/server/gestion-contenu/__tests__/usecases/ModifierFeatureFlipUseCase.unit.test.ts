import { mock, MockProxy } from "vitest-mock-extended";
import { GestionContenuRepository } from "@/server/gestion-contenu/domain/ports/GestionContenuRepository";
import { ModifierFeatureFlipUseCase } from "@/server/gestion-contenu/usecases/ModifierFeatureFlipUseCase";

describe("ModifierFeatureFlipUseCase", () => {
  let modifierFeatureFlipUseCase: ModifierFeatureFlipUseCase;
  let gestionContenuRepository: MockProxy<GestionContenuRepository>;

  beforeEach(() => {
    gestionContenuRepository = mock<GestionContenuRepository>();
    modifierFeatureFlipUseCase = new ModifierFeatureFlipUseCase({
      gestionContenuRepository,
    });
  });

  it("doit mettre à jour uniquement les clés autorisées", async () => {
    // Given
    const featureFlips = {
      NEXT_PUBLIC_FF_ALERTES: true,
      NEXT_PUBLIC_FF_DATE_METEO: false,
    } as const;

    // When
    await modifierFeatureFlipUseCase.run({ featureFlips });

    // Then
    expect(gestionContenuRepository.mettreAJourContenu).toHaveBeenCalledTimes(
      2,
    );
    expect(gestionContenuRepository.mettreAJourContenu).toHaveBeenCalledWith(
      "NEXT_PUBLIC_FF_ALERTES",
      true,
    );
    expect(gestionContenuRepository.mettreAJourContenu).toHaveBeenCalledWith(
      "NEXT_PUBLIC_FF_DATE_METEO",
      false,
    );
  });

  it("doit ignorer les clés qui ne font pas partie des feature flips autorisés", async () => {
    // Given - clé inventée qui ne fait pas partie de FEATURE_FLIP_KEYS
    const featureFlips = {
      NEXT_PUBLIC_FF_ALERTES: true,
      CLE_INCONNUE: true,
    } as Record<string, boolean>;

    // When
    await modifierFeatureFlipUseCase.run({ featureFlips });

    // Then
    expect(gestionContenuRepository.mettreAJourContenu).toHaveBeenCalledTimes(
      1,
    );
    expect(gestionContenuRepository.mettreAJourContenu).toHaveBeenCalledWith(
      "NEXT_PUBLIC_FF_ALERTES",
      true,
    );
  });

  it("ne doit rien mettre à jour si aucun feature flip n'est fourni", async () => {
    // Given
    const featureFlips = {};

    // When
    await modifierFeatureFlipUseCase.run({ featureFlips });

    // Then
    expect(gestionContenuRepository.mettreAJourContenu).not.toHaveBeenCalled();
  });
});
