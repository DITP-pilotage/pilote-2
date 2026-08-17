import { PrismaPilote } from "@/server/db/PrismaPilote";
import { ListerPorteursAdminQuery } from "@/server/metadataPorteur/queries/ListerPorteursAdminQuery";
import { createIntegrationTest } from "@/server/infrastructure/test/createIntegrationTest";
import { fixtures } from "@/server/infrastructure/test/fixtures";

describe("ListerPorteursAdminQuery", () => {
  let query: ListerPorteursAdminQuery;
  const prismaPilote = new PrismaPilote();

  beforeEach(() => {
    query = new ListerPorteursAdminQuery({ prisma: prismaPilote });
  });

  describe("run", () => {
    it(
      "retourne tous les porteurs y compris les supprimés",
      createIntegrationTest(async () => {
        // Given
        await fixtures.metadataPorteur({ porteur_id: "AA001", porteur_short: "AA", porteur_name: "Actif" });
        await fixtures.metadataPorteur({
          porteur_id: "BB001",
          porteur_short: "BB",
          porteur_name: "Supprimé",
          deleted_at: new Date("2026-01-01"),
        });

        // When
        const resultat = await query.run();

        // Then
        const ids = resultat.map((p) => p.porteurId);
        expect(ids).toContain("AA001");
        expect(ids).toContain("BB001");
        const supprime = resultat.find((p) => p.porteurId === "BB001");
        expect(supprime?.deletedAt).not.toBeNull();
      }),
    );
  });
});
