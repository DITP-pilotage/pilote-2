import { vi } from "vitest";
import { PrismaPilote } from "@/server/db/PrismaPilote";
import { createIntegrationTest } from "@/server/infrastructure/test/createIntegrationTest";
import { fixtures } from "@/server/infrastructure/test/fixtures";
import { type MbApiClient } from "@/server/mb-sync/domain/ports/MbApiClient";
import { PrismaMbSyncExecutionRepository } from "@/server/mb-sync/infrastructure/adapters/PrismaMbSyncExecutionRepository";
import { SyncMbValeursUseCase } from "@/server/mb-sync/usecases/SyncMbValeursUseCase";

const TERRITOIRE_CODE = "NAT-FR";
const INDIC_ID = "IND-003";

describe("SyncMbValeursUseCase", () => {
  const prismaPilote = new PrismaPilote();

  const buildUseCase = (mbApiClient: MbApiClient) =>
    new SyncMbValeursUseCase({
      prisma: prismaPilote,
      mbApiClient,
      mbSyncExecutionRepository: new PrismaMbSyncExecutionRepository({
        prisma: prismaPilote,
      }),
    });

  const buildMbApiClientMock = () => {
    const upsertBatch = vi.fn().mockResolvedValue(1);
    return {
      mbApiClient: { upsertBatch } as unknown as MbApiClient,
      upsertBatch,
    };
  };

  const seedIndicateur = async () => {
    const auteur = await fixtures.utilisateur();
    const chantier = await fixtures.chantierIdentite();
    await fixtures.chantierTerritoire({
      id: chantier.id,
      territoire_code: TERRITOIRE_CODE,
      maille: "NAT",
      code_insee: "FR",
      zone_id: "FRANCE",
    });
    await fixtures.indicateurIdentite({ id: INDIC_ID, chantier_id: chantier.id });
    await fixtures.indicateurTerritoire({
      id: INDIC_ID,
      chantier_id: chantier.id,
      territoire_code: TERRITOIRE_CODE,
    });
    return { auteur };
  };

  it(
    "envoie les événements récents à mb-api et met à jour la date de dernière sync",
    createIntegrationTest(async (tx) => {
      // Given
      const { auteur } = await seedIndicateur();
      const dateValeur = new Date("2025-03-01");
      await fixtures.indicateurTerritoireValeurEvenement({
        indic_id: INDIC_ID,
        territoire_code: TERRITOIRE_CODE,
        id_auteur_modification: auteur.id,
        type_evenement: "VALEUR_CREEE",
        date_valeur: dateValeur,
        valeur: 42,
        ordre: 1,
      });
      const { mbApiClient, upsertBatch } = buildMbApiClientMock();

      // When
      const avant = new Date();
      await buildUseCase(mbApiClient).execute();

      // Then
      expect(upsertBatch).toHaveBeenCalledExactlyOnceWith(INDIC_ID, [
        { individu: TERRITOIRE_CODE, date: "2025-03-01", valeur: 42 },
      ]);

      const syncExecution = await tx.mb_sync_execution.findFirst();
      expect(
        syncExecution?.derniere_date_sync.getTime(),
      ).toBeGreaterThanOrEqual(avant.getTime());
    }),
  );

  it(
    "ne fait rien si aucun événement depuis la dernière sync",
    createIntegrationTest(async () => {
      // Given — aucun événement en base
      const { mbApiClient, upsertBatch } = buildMbApiClientMock();

      // When
      await buildUseCase(mbApiClient).execute();

      // Then
      expect(upsertBatch).not.toHaveBeenCalled();
    }),
  );

  it(
    "filtre les événements avec valeur null avant l'envoi",
    createIntegrationTest(async () => {
      // Given
      const { auteur } = await seedIndicateur();
      await fixtures.indicateurTerritoireValeurEvenement({
        indic_id: INDIC_ID,
        territoire_code: TERRITOIRE_CODE,
        id_auteur_modification: auteur.id,
        type_evenement: "VALEUR_CREEE",
        date_valeur: new Date("2025-03-01"),
        valeur: 10,
        ordre: 1,
      });
      // événement avec valeur null (ex : valeur supprimée)
      await fixtures.indicateurTerritoireValeurEvenement({
        indic_id: INDIC_ID,
        territoire_code: TERRITOIRE_CODE,
        id_auteur_modification: auteur.id,
        type_evenement: "VALEUR_MODIFIEE",
        date_valeur: new Date("2025-04-01"),
        valeur: null,
        ordre: 1,
      });
      const { mbApiClient, upsertBatch } = buildMbApiClientMock();

      // When
      await buildUseCase(mbApiClient).execute();

      // Then — seul l'événement avec valeur non nulle est envoyé
      expect(upsertBatch).toHaveBeenCalledExactlyOnceWith(INDIC_ID, [
        { individu: TERRITOIRE_CODE, date: "2025-03-01", valeur: 10 },
      ]);
    }),
  );

  it(
    "garde seulement l'événement avec le plus grand ordre pour une même (indic_id, territoire_code, date_valeur)",
    createIntegrationTest(async () => {
      // Given
      const { auteur } = await seedIndicateur();
      const dateValeur = new Date("2025-03-01");
      // premier événement, ordre inférieur
      await fixtures.indicateurTerritoireValeurEvenement({
        indic_id: INDIC_ID,
        territoire_code: TERRITOIRE_CODE,
        id_auteur_modification: auteur.id,
        type_evenement: "VALEUR_CREEE",
        date_valeur: dateValeur,
        valeur: 50,
        ordre: 1,
      });
      // deuxième événement sur la même date, ordre supérieur — doit être retenu
      await fixtures.indicateurTerritoireValeurEvenement({
        indic_id: INDIC_ID,
        territoire_code: TERRITOIRE_CODE,
        id_auteur_modification: auteur.id,
        type_evenement: "VALEUR_MODIFIEE",
        date_valeur: dateValeur,
        valeur: 75,
        ordre: 2,
      });
      const { mbApiClient, upsertBatch } = buildMbApiClientMock();

      // When
      await buildUseCase(mbApiClient).execute();

      // Then — seule la valeur 75 (ordre 2) est envoyée
      expect(upsertBatch).toHaveBeenCalledExactlyOnceWith(INDIC_ID, [
        { individu: TERRITOIRE_CODE, date: "2025-03-01", valeur: 75 },
      ]);
    }),
  );
});
