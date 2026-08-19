import { PrismaPilote } from "@/server/db/PrismaPilote";
import { RecupererIdSuivantQuery } from "@/server/metadataChantier/queries/RecupererIdSuivantQuery";
import { createIntegrationTest } from "@/server/infrastructure/test/createIntegrationTest";
import { fixtures } from "@/server/infrastructure/test/fixtures";

describe("RecupererIdSuivantQuery", () => {
  let query: RecupererIdSuivantQuery;
  const prismaPilote = new PrismaPilote();

  beforeEach(() => {
    query = new RecupererIdSuivantQuery({ prisma: prismaPilote });
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
