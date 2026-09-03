import { PrismaPilote } from "@/server/db/PrismaPilote";
import { RecupererIdSuivantEngagementQuery } from "@/server/metadataEngagement/queries/RecupererIdSuivantEngagementQuery";
import { createIntegrationTest } from "@/server/infrastructure/test/createIntegrationTest";
import { fixtures } from "@/server/infrastructure/test/fixtures";

describe("RecupererIdSuivantEngagementQuery", () => {
  let query: RecupererIdSuivantEngagementQuery;
  const prismaPilote = new PrismaPilote();

  beforeEach(() => {
    query = new RecupererIdSuivantEngagementQuery({ prisma: prismaPilote });
  });

  describe("run", () => {
    it(
      "retourne 1 si aucun engagement",
      createIntegrationTest(async () => {
        // When
        const resultat = await query.run();

        // Then
        expect(resultat).toBe("1");
      }),
    );

    it(
      "retourne max(id numérique) + 1",
      createIntegrationTest(async () => {
        // Given — ID 5 est le plus grand entier
        await fixtures.metadataEngagement({ engagement_id: "2" });
        await fixtures.metadataEngagement({ engagement_id: "5" });

        // When
        const resultat = await query.run();

        // Then
        expect(resultat).toBe("6");
      }),
    );
  });
});
