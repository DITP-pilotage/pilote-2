import { PrismaPilote } from "@/server/db/PrismaPilote";
import { ArchiverEngagementHandler } from "@/server/metadataEngagement/handlers/ArchiverEngagementHandler";
import { VerifierUtilisationEngagementQuery } from "@/server/metadataEngagement/queries/VerifierUtilisationEngagementQuery";
import { createIntegrationTest } from "@/server/infrastructure/test/createIntegrationTest";
import { fixtures } from "@/server/infrastructure/test/fixtures";
import { getPrisma } from "@/server/db/PrismaTransaction";
import { ConflictError } from "@/server/app/error-boundary/conflict-error";

describe("ArchiverEngagementHandler", () => {
  let handler: ArchiverEngagementHandler;
  const prismaPilote = new PrismaPilote();

  beforeEach(() => {
    handler = new ArchiverEngagementHandler({
      prisma: prismaPilote,
      verifierUtilisationEngagementQuery:
        new VerifierUtilisationEngagementQuery({
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
        const exécuter = () =>
          handler.execute({ engagementId: engagement.engagement_id });

        // Then
        await expect(exécuter).rejects.toThrow(ConflictError);
        const result = await getPrisma().metadata_engagement.findUniqueOrThrow({
          where: { engagement_id: "99" },
        });
        expect(result.deleted_at).toBeNull();
      }),
    );
  });
});
