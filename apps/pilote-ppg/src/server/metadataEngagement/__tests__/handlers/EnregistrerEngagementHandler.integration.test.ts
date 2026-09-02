import { PrismaPilote } from "@/server/db/PrismaPilote";
import { EnregistrerEngagementHandler } from "@/server/metadataEngagement/handlers/EnregistrerEngagementHandler";
import { createIntegrationTest } from "@/server/infrastructure/test/createIntegrationTest";
import { fixtures } from "@/server/infrastructure/test/fixtures";
import { getPrisma } from "@/server/db/PrismaTransaction";

describe("EnregistrerEngagementHandler", () => {
  let handler: EnregistrerEngagementHandler;
  const prismaPilote = new PrismaPilote();

  beforeEach(() => {
    handler = new EnregistrerEngagementHandler({ prisma: prismaPilote });
  });

  describe("execute", () => {
    it(
      "crée un nouvel engagement",
      createIntegrationTest(async () => {
        // When
        await handler.execute({
          engagementId: "96",
          engagementShort: "ENG-96",
          engagementName: "Engagement test",
        });

        // Then
        const engagement =
          await getPrisma().metadata_engagement.findUniqueOrThrow({
            where: { engagement_id: "96" },
          });
        expect(engagement.engagement_short).toBe("ENG-96");
        expect(engagement.engagement_name).toBe("Engagement test");
        expect(engagement.deleted_at).toBeNull();
      }),
    );

    it(
      "met à jour un engagement existant",
      createIntegrationTest(async () => {
        // Given
        await fixtures.metadataEngagement({
          engagement_id: "97",
          engagement_short: "ENG-97",
          engagement_name: "Ancien nom",
        });

        // When
        await handler.execute({
          engagementId: "97",
          engagementShort: "ENG-97",
          engagementName: "Nouveau nom",
        });

        // Then
        const engagement =
          await getPrisma().metadata_engagement.findUniqueOrThrow({
            where: { engagement_id: "97" },
          });
        expect(engagement.engagement_name).toBe("Nouveau nom");
      }),
    );
  });
});
