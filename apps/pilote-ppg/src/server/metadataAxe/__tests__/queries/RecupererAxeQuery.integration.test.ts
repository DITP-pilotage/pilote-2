import { PrismaPilote } from "@/server/db/PrismaPilote";
import { RecupererAxeQuery } from "@/server/metadataAxe/queries/RecupererAxeQuery";
import { createIntegrationTest } from "@/server/infrastructure/test/createIntegrationTest";
import { fixtures } from "@/server/infrastructure/test/fixtures";

describe("RecupererAxeQuery", () => {
  let query: RecupererAxeQuery;
  const prismaPilote = new PrismaPilote();

  beforeEach(() => {
    query = new RecupererAxeQuery({ prisma: prismaPilote });
  });

  describe("run", () => {
    it(
      "retourne l'axe demandé",
      createIntegrationTest(async () => {
        // Given
        await fixtures.metadataAxe({
          axe_id: "AXE-92001",
          axe_name: "Progrès",
          axe_desc: "Une description",
        });

        // When
        const resultat = await query.run({ axeId: "AXE-92001" });

        // Then
        expect(resultat).toEqual({
          axeId: "AXE-92001",
          axeName: "Progrès",
          axeDesc: "Une description",
          deletedAt: null,
        });
      }),
    );
  });
});
