import { PrismaPilote } from "@/server/framework/persistence/PrismaPilote";
import { GetAxeQuery } from "@/server/referentiels/axe/queries/GetAxeQuery";
import { createIntegrationTest } from "@/test/createIntegrationTest";
import { fixtures } from "@/test/fixtures";

describe("GetAxeQuery", () => {
  let query: GetAxeQuery;
  const prismaPilote = new PrismaPilote();

  beforeEach(() => {
    query = new GetAxeQuery({ prisma: prismaPilote });
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
