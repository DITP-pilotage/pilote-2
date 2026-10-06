import { PrismaPilote } from "@/server/framework/persistence/PrismaPilote";
import { ArchiveEngagementHandler } from "@/server/referentiels/engagement/handlers/ArchiveEngagementHandler";
import { CheckEngagementUsageQuery } from "@/server/referentiels/engagement/queries/CheckEngagementUsageQuery";
import { createIntegrationTest } from "@/test/createIntegrationTest";
import { fixtures } from "@/test/fixtures";
import { getPrisma } from "@/server/framework/persistence/PrismaTransaction";
import { ConflictError } from "@/server/app/error-boundary/conflict-error";

describe("ArchiveEngagementHandler", () => {
  let handler: ArchiveEngagementHandler;
  const prismaPilote = new PrismaPilote();

  beforeEach(() => {
    handler = new ArchiveEngagementHandler({
      prisma: prismaPilote,
      checkEngagementUsageQuery: new CheckEngagementUsageQuery({
        prisma: prismaPilote,
      }),
    });
  });

  describe("execute", () => {
    it(
      "pose deleted_at sur l'engagement",
      createIntegrationTest(async () => {
        // Given
        const engagement = await fixtures.metadataEngagement({
          engagement_id: "98",
        });

        // When
        await handler.execute({ engagementId: engagement.engagement_id });

        // Then
        const result = await getPrisma().metadata_engagement.findUniqueOrThrow({
          where: { engagement_id: "98" },
        });
        expect(result.deleted_at).not.toBeNull();
      }),
    );

    it(
      "lève une ConflictError et ne supprime pas l'engagement s'il est associé à un chantier",
      createIntegrationTest(async () => {
        // Given
        const engagement = await fixtures.metadataEngagement({
          engagement_id: "99",
          engagement_short: "ENG-99",
        });
        await fixtures.metadataChantier({
          engagement_short: engagement.engagement_short,
        });

        // When
        const execute = () =>
          handler.execute({ engagementId: engagement.engagement_id });

        // Then
        await expect(execute).rejects.toThrow(ConflictError);
        const result = await getPrisma().metadata_engagement.findUniqueOrThrow({
          where: { engagement_id: "99" },
        });
        expect(result.deleted_at).toBeNull();
      }),
    );
  });
});
