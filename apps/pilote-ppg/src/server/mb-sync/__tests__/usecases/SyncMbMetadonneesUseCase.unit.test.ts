import { mock, type MockProxy } from "vitest-mock-extended";
import { type MbApiClient } from "@/server/mb-sync/domain/ports/MbApiClient";
import { type IndicateurIdentiteRepository } from "@/server/mb-sync/domain/ports/IndicateurIdentiteRepository";
import { SyncMbMetadonneesUseCase } from "@/server/mb-sync/usecases/SyncMbMetadonneesUseCase";

const INDIC_ID = "IND-003";

describe("SyncMbMetadonneesUseCase", () => {
  let useCase: SyncMbMetadonneesUseCase;
  let indicateurIdentiteRepository: MockProxy<IndicateurIdentiteRepository>;
  let mbApiClient: MockProxy<MbApiClient>;

  beforeEach(() => {
    indicateurIdentiteRepository = mock<IndicateurIdentiteRepository>();
    mbApiClient = mock<MbApiClient>();
    useCase = new SyncMbMetadonneesUseCase({
      indicateurIdentiteRepository,
      mbApiClient,
    });
  });

  it("envoie les métadonnées avec les référentiels dérivés des mailles applicables", async () => {
    // Given
    indicateurIdentiteRepository.findById.mockResolvedValue({
      nom: "Taux de chômage",
      maillesApplicables: ["NAT", "REG"],
    });

    // When
    const resultat = await useCase.execute([INDIC_ID]);

    // Then
    expect(mbApiClient.upsertIndicateur).toHaveBeenCalledExactlyOnceWith({
      indicId: INDIC_ID,
      payload: {
        nom: "Taux de chômage",
        visibilite: "PUBLIC",
        referentiels: [
          { referentielPublicId: "REF-NAT", fonctionAgregation: "NONE" },
          { referentielPublicId: "REF-REG", fonctionAgregation: "NONE" },
        ],
      },
    });
    expect(resultat).toEqual({
      indicateurs: [{ id: INDIC_ID, statut: "ok" }],
    });
  });

  it("ignore un indicateur absent sans bloquer", async () => {
    // Given
    indicateurIdentiteRepository.findById.mockResolvedValue(null);

    // When
    const resultat = await useCase.execute([INDIC_ID]);

    // Then
    expect(mbApiClient.upsertIndicateur).not.toHaveBeenCalled();
    expect(resultat).toEqual({
      indicateurs: [{ id: INDIC_ID, statut: "non_trouve" }],
    });
  });

  it("propage l'erreur si upsertIndicateur échoue", async () => {
    // Given
    indicateurIdentiteRepository.findById.mockResolvedValue({
      nom: "Mon indicateur",
      maillesApplicables: ["NAT"],
    });
    mbApiClient.upsertIndicateur.mockRejectedValue(
      new Error("mb-api indisponible"),
    );

    // When / Then
    await expect(useCase.execute([INDIC_ID])).rejects.toThrow(
      "mb-api indisponible",
    );
  });
});
