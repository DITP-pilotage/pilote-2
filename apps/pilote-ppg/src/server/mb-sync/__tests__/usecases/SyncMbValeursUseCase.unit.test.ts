import { mock, type MockProxy } from "vitest-mock-extended";
import { type MbApiClient } from "@/server/mb-sync/domain/ports/MbApiClient";
import { type MbSyncExecutionRepository } from "@/server/mb-sync/domain/ports/MbSyncExecutionRepository";
import { type IndicateurTerritoireValeurEvenementRepository } from "@/server/mb-sync/domain/ports/IndicateurTerritoireValeurEvenementRepository";
import { SyncMbValeursUseCase } from "@/server/mb-sync/usecases/SyncMbValeursUseCase";

const TERRITOIRE_CODE = "NAT-FR";
const INDIC_ID = "IND-003";
const LAST_SYNC_AT = new Date("2025-01-01");

describe("SyncMbValeursUseCase", () => {
  let useCase: SyncMbValeursUseCase;
  let indicateurTerritoireValeurEvenementRepository: MockProxy<IndicateurTerritoireValeurEvenementRepository>;
  let mbApiClient: MockProxy<MbApiClient>;
  let mbSyncExecutionRepository: MockProxy<MbSyncExecutionRepository>;

  beforeEach(() => {
    indicateurTerritoireValeurEvenementRepository =
      mock<IndicateurTerritoireValeurEvenementRepository>();
    mbApiClient = mock<MbApiClient>();
    mbSyncExecutionRepository = mock<MbSyncExecutionRepository>();

    mbSyncExecutionRepository.recupererDerniereDateSync.mockResolvedValue(
      LAST_SYNC_AT,
    );
    mbApiClient.upsertValeursAvancementBatch.mockResolvedValue(1);
    mbApiClient.deleteValeursAvancement.mockResolvedValue(1);

    useCase = new SyncMbValeursUseCase({
      indicateurTerritoireValeurEvenementRepository,
      mbApiClient,
      mbSyncExecutionRepository,
    });
  });

  it("envoie les événements récents à mb-api et met à jour la date de dernière sync", async () => {
    // Given
    const dateValeur = new Date("2025-03-01");
    indicateurTerritoireValeurEvenementRepository.recupererEvenementsModifiesDepuis.mockResolvedValue(
      [
        {
          indicId: INDIC_ID,
          territoire_code: TERRITOIRE_CODE,
          dateValeur,
          valeur: 42,
        },
      ],
    );

    // When
    const avant = new Date();
    await useCase.execute([INDIC_ID]);

    // Then
    expect(
      mbApiClient.upsertValeursAvancementBatch,
    ).toHaveBeenCalledExactlyOnceWith({
      indicId: INDIC_ID,
      items: [{ individu: TERRITOIRE_CODE, date: "2025-03-01", valeur: 42 }],
    });
    expect(mbApiClient.deleteValeursAvancement).not.toHaveBeenCalled();
    expect(
      mbSyncExecutionRepository.mettreAJourDerniereDateSync,
    ).toHaveBeenCalledOnce();
    const [dateSync] =
      mbSyncExecutionRepository.mettreAJourDerniereDateSync.mock.calls[0];
    expect(dateSync.getTime()).toBeGreaterThanOrEqual(avant.getTime());
  });

  it("ne fait rien si aucun événement depuis la dernière sync", async () => {
    // Given
    indicateurTerritoireValeurEvenementRepository.recupererEvenementsModifiesDepuis.mockResolvedValue(
      [],
    );

    // When
    await useCase.execute([INDIC_ID]);

    // Then
    expect(mbApiClient.upsertValeursAvancementBatch).not.toHaveBeenCalled();
    expect(mbApiClient.deleteValeursAvancement).not.toHaveBeenCalled();
  });

  it("appelle deleteValeursAvancement pour les événements avec valeur null", async () => {
    // Given
    indicateurTerritoireValeurEvenementRepository.recupererEvenementsModifiesDepuis.mockResolvedValue(
      [
        {
          indicId: INDIC_ID,
          territoire_code: TERRITOIRE_CODE,
          dateValeur: new Date("2025-04-01"),
          valeur: null,
        },
      ],
    );

    // When
    await useCase.execute([INDIC_ID]);

    // Then
    expect(mbApiClient.deleteValeursAvancement).toHaveBeenCalledExactlyOnceWith(
      {
        indicId: INDIC_ID,
        items: [{ individu: TERRITOIRE_CODE, date: "2025-04-01" }],
      },
    );
    expect(mbApiClient.upsertValeursAvancementBatch).not.toHaveBeenCalled();
  });

  it("sépare upserts et deletes quand les événements sont mixtes", async () => {
    // Given
    indicateurTerritoireValeurEvenementRepository.recupererEvenementsModifiesDepuis.mockResolvedValue(
      [
        {
          indicId: INDIC_ID,
          territoire_code: TERRITOIRE_CODE,
          dateValeur: new Date("2025-03-01"),
          valeur: 10,
        },
        {
          indicId: INDIC_ID,
          territoire_code: TERRITOIRE_CODE,
          dateValeur: new Date("2025-04-01"),
          valeur: null,
        },
      ],
    );

    // When
    await useCase.execute([INDIC_ID]);

    // Then
    expect(
      mbApiClient.upsertValeursAvancementBatch,
    ).toHaveBeenCalledExactlyOnceWith({
      indicId: INDIC_ID,
      items: [{ individu: TERRITOIRE_CODE, date: "2025-03-01", valeur: 10 }],
    });
    expect(mbApiClient.deleteValeursAvancement).toHaveBeenCalledExactlyOnceWith(
      {
        indicId: INDIC_ID,
        items: [{ individu: TERRITOIRE_CODE, date: "2025-04-01" }],
      },
    );
  });

  it("agrège upserts et deletes dans le total du résultat", async () => {
    // Given — 2 upserts retournent 2, 1 delete retourne 1
    mbApiClient.upsertValeursAvancementBatch.mockResolvedValue(2);
    mbApiClient.deleteValeursAvancement.mockResolvedValue(1);
    indicateurTerritoireValeurEvenementRepository.recupererEvenementsModifiesDepuis.mockResolvedValue(
      [
        {
          indicId: INDIC_ID,
          territoire_code: TERRITOIRE_CODE,
          dateValeur: new Date("2025-03-01"),
          valeur: 10,
        },
        {
          indicId: INDIC_ID,
          territoire_code: "REG-84",
          dateValeur: new Date("2025-03-01"),
          valeur: 20,
        },
        {
          indicId: INDIC_ID,
          territoire_code: TERRITOIRE_CODE,
          dateValeur: new Date("2025-04-01"),
          valeur: null,
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

  it("retourne le lastSyncAt de la précédente exécution dans le résultat", async () => {
    // Given
    indicateurTerritoireValeurEvenementRepository.recupererEvenementsModifiesDepuis.mockResolvedValue(
      [],
    );

    // When
    const resultat = await useCase.execute([INDIC_ID]);

    // Then
    expect(resultat.lastSyncAt).toEqual(LAST_SYNC_AT.toISOString());
  });
});
