import { mock, type MockProxy } from "vitest-mock-extended";
import { type MbApiClient } from "@/server/mb-sync/domain/ports/MbApiClient";
import { type MesureIndicateurObjectifRepository } from "@/server/mb-sync/domain/ports/MesureIndicateurObjectifRepository";
import { SyncMbObjectifsUseCase } from "@/server/mb-sync/usecases/SyncMbObjectifsUseCase";

const TERRITOIRE_CODE = "DEPT-75";
const INDIC_ID = "IND-003";

describe("SyncMbObjectifsUseCase", () => {
  let useCase: SyncMbObjectifsUseCase;
  let mesureIndicateurObjectifRepository: MockProxy<MesureIndicateurObjectifRepository>;
  let mbApiClient: MockProxy<MbApiClient>;

  beforeEach(() => {
    mesureIndicateurObjectifRepository =
      mock<MesureIndicateurObjectifRepository>();
    mbApiClient = mock<MbApiClient>();

    mesureIndicateurObjectifRepository.recupererDernieresValeursCibles.mockResolvedValue(
      [],
    );
    mbApiClient.upsertObjectifsIndicateurBatch.mockResolvedValue(1);
    mbApiClient.deleteObjectifIndicateur.mockResolvedValue(undefined);

    useCase = new SyncMbObjectifsUseCase({
      mesureIndicateurObjectifRepository,
      mbApiClient,
    });
  });

  it("envoie les valeurs cibles à mb-api en batch", async () => {
    // Given
    mesureIndicateurObjectifRepository.recupererDernieresValeursCibles.mockResolvedValue(
      [
        {
          territoire_code: TERRITOIRE_CODE,
          metric_date: "2025-12-31",
          metric_value: 100,
        },
      ],
    );

    // When
    await useCase.execute([INDIC_ID]);

    // Then
    expect(
      mbApiClient.upsertObjectifsIndicateurBatch,
    ).toHaveBeenCalledExactlyOnceWith({
      indicId: INDIC_ID,
      items: [
        {
          individu: TERRITOIRE_CODE,
          dateCible: "2025-12-31",
          valeurCible: 100,
        },
      ],
    });
    expect(mbApiClient.deleteObjectifIndicateur).not.toHaveBeenCalled();
  });

  it("ne fait rien si aucune vc pour l'indicateur", async () => {
    // Given — default beforeEach retourne []

    // When
    await useCase.execute([INDIC_ID]);

    // Then
    expect(mbApiClient.upsertObjectifsIndicateurBatch).not.toHaveBeenCalled();
    expect(mbApiClient.deleteObjectifIndicateur).not.toHaveBeenCalled();
  });

  it("appelle deleteObjectifIndicateur pour les vc avec metric_value null", async () => {
    // Given
    mesureIndicateurObjectifRepository.recupererDernieresValeursCibles.mockResolvedValue(
      [
        {
          territoire_code: TERRITOIRE_CODE,
          metric_date: "2025-12-31",
          metric_value: null,
        },
      ],
    );

    // When
    await useCase.execute([INDIC_ID]);

    // Then
    expect(
      mbApiClient.deleteObjectifIndicateur,
    ).toHaveBeenCalledExactlyOnceWith({
      indicId: INDIC_ID,
      item: { individu: TERRITOIRE_CODE, dateCible: "2025-12-31" },
    });
    expect(mbApiClient.upsertObjectifsIndicateurBatch).not.toHaveBeenCalled();
  });

  it("sépare upserts et deletes quand les mesures sont mixtes", async () => {
    // Given
    mesureIndicateurObjectifRepository.recupererDernieresValeursCibles.mockResolvedValue(
      [
        {
          territoire_code: TERRITOIRE_CODE,
          metric_date: "2025-12-31",
          metric_value: 100,
        },
        {
          territoire_code: "DEPT-13",
          metric_date: "2025-12-31",
          metric_value: null,
        },
      ],
    );

    // When
    await useCase.execute([INDIC_ID]);

    // Then
    expect(
      mbApiClient.upsertObjectifsIndicateurBatch,
    ).toHaveBeenCalledExactlyOnceWith({
      indicId: INDIC_ID,
      items: [
        {
          individu: TERRITOIRE_CODE,
          dateCible: "2025-12-31",
          valeurCible: 100,
        },
      ],
    });
    expect(
      mbApiClient.deleteObjectifIndicateur,
    ).toHaveBeenCalledExactlyOnceWith({
      indicId: INDIC_ID,
      item: { individu: "DEPT-13", dateCible: "2025-12-31" },
    });
  });

  it("agrège upserts et deletes dans le résultat de l'indicateur", async () => {
    // Given — 2 upserts retournent 2, 1 delete
    mbApiClient.upsertObjectifsIndicateurBatch.mockResolvedValue(2);
    mesureIndicateurObjectifRepository.recupererDernieresValeursCibles.mockResolvedValue(
      [
        {
          territoire_code: TERRITOIRE_CODE,
          metric_date: "2025-12-31",
          metric_value: 100,
        },
        {
          territoire_code: "DEPT-13",
          metric_date: "2025-12-31",
          metric_value: 200,
        },
        {
          territoire_code: "DEPT-69",
          metric_date: "2025-12-31",
          metric_value: null,
        },
      ],
    );

    // When
    const resultat = await useCase.execute([INDIC_ID]);

    // Then
    expect(resultat.indicateurs).toEqual([
      { id: INDIC_ID, upserts: 2, deletes: 1 },
    ]);
  });

  it("ignore silencieusement les valeurs non numériques (NaN) et les exclut des upserts", async () => {
    // Given — metric_value parsée en NaN (valeur corrompue en base)
    mesureIndicateurObjectifRepository.recupererDernieresValeursCibles.mockResolvedValue(
      [
        {
          territoire_code: TERRITOIRE_CODE,
          metric_date: "2025-12-31",
          metric_value: NaN,
        },
        {
          territoire_code: "DEPT-13",
          metric_date: "2025-12-31",
          metric_value: 200,
        },
      ],
    );

    // When
    await useCase.execute([INDIC_ID]);

    // Then — seule la valeur 200 est envoyée
    expect(
      mbApiClient.upsertObjectifsIndicateurBatch,
    ).toHaveBeenCalledExactlyOnceWith({
      indicId: INDIC_ID,
      items: [
        { individu: "DEPT-13", dateCible: "2025-12-31", valeurCible: 200 },
      ],
    });
  });

  it("itère sur plusieurs indicateurs et retourne un résultat par indicateur", async () => {
    // Given
    const INDIC_B = "IND-099";
    mesureIndicateurObjectifRepository.recupererDernieresValeursCibles
      .mockResolvedValueOnce([
        {
          territoire_code: TERRITOIRE_CODE,
          metric_date: "2025-12-31",
          metric_value: 100,
        },
      ])
      .mockResolvedValueOnce([]);

    // When
    const resultat = await useCase.execute([INDIC_ID, INDIC_B]);

    // Then
    expect(resultat.indicateurs).toEqual([
      { id: INDIC_ID, upserts: 1, deletes: 0 },
      { id: INDIC_B, upserts: 0, deletes: 0 },
    ]);
  });
});
