import { PrismaPilote } from "@/server/db/PrismaPilote";
import { RestorerEngagementHandler } from "@/server/metadataEngagement/handlers/RestorerEngagementHandler";
import { createIntegrationTest } from "@/server/infrastructure/test/createIntegrationTest";
import { fixtures } from "@/server/infrastructure/test/fixtures";
import { getPrisma } from "@/server/db/PrismaTransaction";

describe("RestorerEngagementHandler", () => {
  let handler: RestorerEngagementHandler;
  const prismaPilote = new PrismaPilote();

  beforeEach(() => {
    handler = new RestorerEngagementHandler({ prisma: prismaPilote });
  });

  describe("execute", () => {
    it(
      "restaure un engagement supprimé",
      createIntegrationTest(async () => {
        // Given
        const engagement = await fixtures.metadataEngagement({
          engagement_id: "100",
          deleted_at: new Date("2026-01-01"),
        });

        // When
        await handler.execute({ engagementId: engagement.engagement_id });

        // Then
        const result = await getPrisma().metadata_engagement.findUniqueOrThrow({
          where: { engagement_id: "100" },
        });
        expect(result.deleted_at).toBeNull();
      }),
    );
  });
});
