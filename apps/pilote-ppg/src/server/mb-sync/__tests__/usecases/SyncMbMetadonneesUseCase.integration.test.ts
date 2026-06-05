import { vi } from "vitest";
import { PrismaPilote } from "@/server/db/PrismaPilote";
import { createIntegrationTest } from "@/server/infrastructure/test/createIntegrationTest";
import { fixtures } from "@/server/infrastructure/test/fixtures";
import { type MbApiClient } from "@/server/mb-sync/domain/ports/MbApiClient";
import { SyncMbMetadonneesUseCase } from "@/server/mb-sync/usecases/SyncMbMetadonneesUseCase";

const INDIC_ID = "IND-003";

describe("SyncMbMetadonneesUseCase", () => {
  const prismaPilote = new PrismaPilote();

  const buildUseCase = (mbApiClient: MbApiClient) =>
    new SyncMbMetadonneesUseCase({ prisma: prismaPilote, mbApiClient });

  const buildMbApiClientMock = () => {
    const upsertIndicateur = vi.fn().mockResolvedValue(undefined);
    return {
      mbApiClient: { upsertIndicateur } as unknown as MbApiClient,
      upsertIndicateur,
    };
  };

  it(
    "envoie les métadonnées avec les référentiels dérivés des mailles applicables",
    createIntegrationTest(async () => {
      // Given
      const chantier = await fixtures.chantierIdentite();
      await fixtures.indicateurIdentite({
        id: INDIC_ID,
        chantier_id: chantier.id,
        nom: "Taux de chômage",
        mailles_applicables: ["NAT", "REG"],
      });
      const { mbApiClient, upsertIndicateur } = buildMbApiClientMock();

      // When
      const resultat = await buildUseCase(mbApiClient).execute();

      // Then
      expect(upsertIndicateur).toHaveBeenCalledExactlyOnceWith(INDIC_ID, {
        nom: "Taux de chômage",
        visibilite: "PRIVE",
        referentiels: [
          { referentielPublicId: "REF-NAT", fonctionAgregation: "NONE" },
          { referentielPublicId: "REF-REG", fonctionAgregation: "NONE" },
        ],
      });
      expect(resultat).toEqual({
        indicateurs: [{ id: INDIC_ID, statut: "ok" }],
      });
    }),
  );

  it(
    "ignore un indicateur absent de indicateur_identite sans bloquer",
    createIntegrationTest(async () => {
      // Given — aucun indicateur en base
      const { mbApiClient, upsertIndicateur } = buildMbApiClientMock();

      // When
      const resultat = await buildUseCase(mbApiClient).execute();

      // Then
      expect(upsertIndicateur).not.toHaveBeenCalled();
      expect(resultat).toEqual({
        indicateurs: [{ id: INDIC_ID, statut: "non_trouve" }],
      });
    }),
  );

  it(
    "propage l'erreur si upsertIndicateur échoue",
    createIntegrationTest(async () => {
      // Given
      const chantier = await fixtures.chantierIdentite();
      await fixtures.indicateurIdentite({
        id: INDIC_ID,
        chantier_id: chantier.id,
        mailles_applicables: ["NAT"],
      });
      const { mbApiClient } = buildMbApiClientMock();
      (mbApiClient as unknown as { upsertIndicateur: ReturnType<typeof vi.fn> })
        .upsertIndicateur = vi
        .fn()
        .mockRejectedValue(new Error("mb-api indisponible"));

      // When / Then
      await expect(buildUseCase(mbApiClient).execute()).rejects.toThrow(
        "mb-api indisponible",
      );
    }),
  );
});
