import { PrismaPilote } from "@/server/db/PrismaPilote";
import { RecupererEngagementQuery } from "@/server/metadataEngagement/queries/RecupererEngagementQuery";
import { createIntegrationTest } from "@/server/infrastructure/test/createIntegrationTest";
import { fixtures } from "@/server/infrastructure/test/fixtures";

describe("RecupererEngagementQuery", () => {
  let query: RecupererEngagementQuery;
  const prismaPilote = new PrismaPilote();

  beforeEach(() => {
    query = new RecupererEngagementQuery({ prisma: prismaPilote });
  });

  describe("run", () => {
    it(
      "retourne l'engagement demandé",
      createIntegrationTest(async () => {
        // Given
        await fixtures.metadataEngagement({
          engagement_id: "93",
          engagement_short: "ENG-93",
          engagement_name: "Engagement test",
        });

        // When
        const resultat = await query.run({ engagementId: "93" });

        // Then
        expect(resultat).toEqual({
          engagementId: "93",
          engagementShort: "ENG-93",
          engagementName: "Engagement test",
          deletedAt: null,
        });
      }),
    );
  });
});
