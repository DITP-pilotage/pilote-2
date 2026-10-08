import { PrismaPilote } from "@/server/framework/persistence/PrismaPilote";
import { GetNextPerimetreIdQuery } from "@/server/referentiels/perimetre/queries/GetNextPerimetreIdQuery";
import { createIntegrationTest } from "@/test/createIntegrationTest";
import { fixtures } from "@/test/fixtures";

describe("GetNextPerimetreIdQuery", () => {
  let query: GetNextPerimetreIdQuery;
  const prismaPilote = new PrismaPilote();

  beforeEach(() => {
    query = new GetNextPerimetreIdQuery({ prisma: prismaPilote });
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
