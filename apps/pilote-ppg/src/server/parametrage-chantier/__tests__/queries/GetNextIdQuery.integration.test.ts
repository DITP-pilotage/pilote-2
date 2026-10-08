import { PrismaPilote } from "@/server/framework/persistence/PrismaPilote";
import { GetNextIdQuery } from "@/server/parametrage-chantier/queries/GetNextIdQuery";
import { createIntegrationTest } from "@/test/createIntegrationTest";
import { fixtures } from "@/test/fixtures";

describe("GetNextIdQuery", () => {
  let query: GetNextIdQuery;
  const prismaPilote = new PrismaPilote();

  beforeEach(() => {
    query = new GetNextIdQuery({ prisma: prismaPilote });
  });

  describe("run", () => {
    it(
      "retourne CH-001 si aucun chantier n'existe",
      createIntegrationTest(async () => {
        // Given

        // When
        const resultat = await query.run();

        // Then
        expect(resultat).toBe("CH-001");
      }),
    );

    it(
      "retourne l'id suivant le dernier chantier",
      createIntegrationTest(async () => {
        // Given
        await fixtures.metadataChantier({ chantier_id: "CH-005" });
        await fixtures.metadataChantier({ chantier_id: "CH-012" });
        await fixtures.metadataChantier({ chantier_id: "CH-003" });

        // When
        const resultat = await query.run();

        // Then
        expect(resultat).toBe("CH-013");
      }),
    );
  });
});
