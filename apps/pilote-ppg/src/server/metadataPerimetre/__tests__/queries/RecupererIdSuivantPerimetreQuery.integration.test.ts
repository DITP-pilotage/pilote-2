import { PrismaPilote } from "@/server/db/PrismaPilote";
import { RecupererIdSuivantPerimetreQuery } from "@/server/metadataPerimetre/queries/RecupererIdSuivantPerimetreQuery";
import { createIntegrationTest } from "@/server/infrastructure/test/createIntegrationTest";
import { fixtures } from "@/server/infrastructure/test/fixtures";

describe("RecupererIdSuivantPerimetreQuery", () => {
  let query: RecupererIdSuivantPerimetreQuery;
  const prismaPilote = new PrismaPilote();

  beforeEach(() => {
    query = new RecupererIdSuivantPerimetreQuery({ prisma: prismaPilote });
  });

  describe("run", () => {
    it(
      "retourne PER-001 si aucun périmètre",
      createIntegrationTest(async () => {
        // When
        const resultat = await query.run();

        // Then
        expect(resultat).toBe("PER-001");
      }),
    );

    it(
      "retourne le prochain ID en format PER-XXX",
      createIntegrationTest(async () => {
        // Given
        await fixtures.metadataPerimetre({ perimetre_id: "PER-005" });
        await fixtures.metadataPerimetre({ perimetre_id: "PER-012" });

        // When
        const resultat = await query.run();

        // Then
        expect(resultat).toBe("PER-013");
      }),
    );
  });
});
