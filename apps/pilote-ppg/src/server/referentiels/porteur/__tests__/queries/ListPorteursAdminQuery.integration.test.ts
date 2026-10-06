import { PrismaPilote } from "@/server/framework/persistence/PrismaPilote";
import { ListPorteursAdminQuery } from "@/server/referentiels/porteur/queries/ListPorteursAdminQuery";
import { createIntegrationTest } from "@/test/createIntegrationTest";
import { fixtures } from "@/test/fixtures";

describe("ListPorteursAdminQuery", () => {
  let query: ListPorteursAdminQuery;
  const prismaPilote = new PrismaPilote();

  beforeEach(() => {
    query = new ListPorteursAdminQuery({ prisma: prismaPilote });
  });

  describe("run", () => {
    it(
      "retourne tous les porteurs y compris les supprimés",
      createIntegrationTest(async () => {
        // Given
        await fixtures.metadataPorteur({
          porteur_id: "AA001",
          porteur_short: "AA",
          porteur_name: "Actif",
        });
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
