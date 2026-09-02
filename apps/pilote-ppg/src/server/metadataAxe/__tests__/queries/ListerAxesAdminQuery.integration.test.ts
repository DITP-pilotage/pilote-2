import { PrismaPilote } from "@/server/db/PrismaPilote";
import { ListerAxesAdminQuery } from "@/server/metadataAxe/queries/ListerAxesAdminQuery";
import { createIntegrationTest } from "@/server/infrastructure/test/createIntegrationTest";
import { fixtures } from "@/server/infrastructure/test/fixtures";

describe("ListerAxesAdminQuery", () => {
  let query: ListerAxesAdminQuery;
  const prismaPilote = new PrismaPilote();

  beforeEach(() => {
    query = new ListerAxesAdminQuery({ prisma: prismaPilote });
  });

  describe("run", () => {
    it(
      "retourne tous les axes y compris les supprimés",
      createIntegrationTest(async () => {
        // Given
        await fixtures.metadataAxe({
          axe_id: "AXE-AA",
          axe_name: "Actif",
        });
        await fixtures.metadataAxe({
          axe_id: "AXE-BB",
          axe_name: "Supprimé",
          deleted_at: new Date("2026-01-01"),
        });

        // When
        const resultat = await query.run();

        // Then
        const ids = resultat.map((a) => a.axeId);
        expect(ids).toContain("AXE-AA");
        expect(ids).toContain("AXE-BB");
        const supprime = resultat.find((a) => a.axeId === "AXE-BB");
        expect(supprime?.deletedAt).not.toBeNull();
      }),
    );
  });
});
