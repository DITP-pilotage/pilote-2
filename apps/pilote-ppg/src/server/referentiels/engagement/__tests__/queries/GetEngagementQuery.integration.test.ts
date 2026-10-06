import { PrismaPilote } from "@/server/framework/persistence/PrismaPilote";
import { GetEngagementQuery } from "@/server/referentiels/engagement/queries/GetEngagementQuery";
import { createIntegrationTest } from "@/test/createIntegrationTest";
import { fixtures } from "@/test/fixtures";

describe("GetEngagementQuery", () => {
  let query: GetEngagementQuery;
  const prismaPilote = new PrismaPilote();

  beforeEach(() => {
    query = new GetEngagementQuery({ prisma: prismaPilote });
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
