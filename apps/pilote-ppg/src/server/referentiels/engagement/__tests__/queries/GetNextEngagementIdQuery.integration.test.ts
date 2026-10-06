import { PrismaPilote } from "@/server/framework/persistence/PrismaPilote";
import { GetNextEngagementIdQuery } from "@/server/referentiels/engagement/queries/GetNextEngagementIdQuery";
import { createIntegrationTest } from "@/test/createIntegrationTest";
import { fixtures } from "@/test/fixtures";

describe("GetNextEngagementIdQuery", () => {
  let query: GetNextEngagementIdQuery;
  const prismaPilote = new PrismaPilote();

  beforeEach(() => {
    query = new GetNextEngagementIdQuery({ prisma: prismaPilote });
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
