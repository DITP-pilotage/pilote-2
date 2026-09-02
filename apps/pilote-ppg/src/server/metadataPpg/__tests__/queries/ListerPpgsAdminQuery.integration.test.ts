import { PrismaPilote } from "@/server/db/PrismaPilote";
import { ListerPpgsAdminQuery } from "@/server/metadataPpg/queries/ListerPpgsAdminQuery";
import { createIntegrationTest } from "@/server/infrastructure/test/createIntegrationTest";
import { fixtures } from "@/server/infrastructure/test/fixtures";

describe("ListerPpgsAdminQuery", () => {
  let query: ListerPpgsAdminQuery;
  const prismaPilote = new PrismaPilote();

  beforeEach(() => {
    query = new ListerPpgsAdminQuery({ prisma: prismaPilote });
  });

  describe("run", () => {
    it(
      "retourne tous les PPG y compris les supprimés",
      createIntegrationTest(async () => {
        // Given
        await fixtures.metadataPpg({
          ppg_id: "PPG-AA",
          ppg_nom: "Actif",
        });
        await fixtures.metadataPpg({
          ppg_id: "PPG-BB",
          ppg_nom: "Supprimé",
          deleted_at: new Date("2026-01-01"),
        });

        // When
        const resultat = await query.run();

        // Then
        const ids = resultat.map((p) => p.ppgId);
        expect(ids).toContain("PPG-AA");
        expect(ids).toContain("PPG-BB");
        const supprime = resultat.find((p) => p.ppgId === "PPG-BB");
        expect(supprime?.deletedAt).not.toBeNull();
      }),
    );
  });
});
