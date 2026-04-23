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
        nouvellePageAccueil: false,
        rapportDetaille: true,
        infobullePonderation: false,
        dateMeteo: false,
        alertes: true,
        alertesBaisse: false,
        applicationIndisponible: false,
        ficheConducteur: false,
        gestionTokenAPI: false,
        taAnnuel: false,
        suiviCompletude: false,
        alerteMAJIndicateur: false,
        docsAPI: false,
        ppgArchive: false,
        poserUneQuestionIndicateur: false,
        videoAccueil: false,
        panelAdmin: false,
        monProfil: false,
        askAI: false,
        centreAideAdmin: false,
        centreAidePilote: false,
        piloteEval: false,
        rapportCoordinateurs: false,
        rapportPva: false,
        creationCompteArs: false,
        masquerIndicateursNonApplicables: false,
        accesPilote: false,
        comparaisonTerritoires: false,
        ficheTerritoriale: false,
        voirHistoriqueProposition: false,
        pvaValeurDifferente: false,
        lienContactBrevo: false,
        reorganisationPageAccueil: false,
      },
    } as ReturnType<typeof configuration>);

    // When
    const result = await recupererFeatureFlipsUseCase.run();

    // Then
    expect(result.NEXT_PUBLIC_FF_RAPPORT_DETAILLE).toBe(true);
    expect(result.NEXT_PUBLIC_FF_ALERTES).toBe(true);
    expect(result.NEXT_PUBLIC_FF_NOUVELLE_PAGE_ACCUEIL).toBe(false);
    expect(
      gestionContenuRepository.recupererMapVariableContenuParListeDeNom,
    ).not.toHaveBeenCalled();
  });

  it("doit fusionner les overrides DB quand featureFlipAdmin est activé", async () => {
    // Given
    vi.mocked(configuration).mockReturnValue({
      featureFlip: {
        featureFlipAdmin: true,
        nouvellePageAccueil: false,
        rapportDetaille: true,
        infobullePonderation: false,
        dateMeteo: false,
        alertes: true,
        alertesBaisse: false,
        applicationIndisponible: false,
        ficheConducteur: false,
        gestionTokenAPI: false,
        taAnnuel: false,
        suiviCompletude: false,
        alerteMAJIndicateur: false,
        docsAPI: false,
        ppgArchive: false,
        poserUneQuestionIndicateur: false,
        videoAccueil: false,
        panelAdmin: false,
        monProfil: false,
        askAI: false,
        centreAideAdmin: false,
        centreAidePilote: false,
        piloteEval: false,
        rapportCoordinateurs: false,
        rapportPva: false,
        creationCompteArs: false,
        masquerIndicateursNonApplicables: false,
        accesPilote: false,
        comparaisonTerritoires: false,
        ficheTerritoriale: false,
        voirHistoriqueProposition: false,
        pvaValeurDifferente: false,
        lienContactBrevo: false,
        reorganisationPageAccueil: false,
      },
    } as ReturnType<typeof configuration>);

    // DB override : alertes passe à false, nouvellePageAccueil passe à true
    gestionContenuRepository.recupererMapVariableContenuParListeDeNom.mockResolvedValue(
      {
        NEXT_PUBLIC_FF_ALERTES: false,
        NEXT_PUBLIC_FF_NOUVELLE_PAGE_ACCUEIL: true,
      },
    );

    // When
    const result = await recupererFeatureFlipsUseCase.run();

    // Then
    expect(result.NEXT_PUBLIC_FF_ALERTES).toBe(false);
    expect(result.NEXT_PUBLIC_FF_NOUVELLE_PAGE_ACCUEIL).toBe(true);
    expect(result.NEXT_PUBLIC_FF_RAPPORT_DETAILLE).toBe(true);
  });
});
