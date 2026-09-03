import { PrismaPilote } from "@/server/db/PrismaPilote";
import { EnregistrerEngagementHandler } from "@/server/metadataEngagement/handlers/EnregistrerEngagementHandler";
import { createIntegrationTest } from "@/server/infrastructure/test/createIntegrationTest";
import { fixtures } from "@/server/infrastructure/test/fixtures";
import { getPrisma } from "@/server/db/PrismaTransaction";
import { BadRequestError } from "@/server/app/error-boundary/bad-request-error";

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
          estUneCréation: true,
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
          estUneCréation: false,
        });

        // Then
        const engagement =
          await getPrisma().metadata_engagement.findUniqueOrThrow({
            where: { engagement_id: "97" },
          });
        expect(engagement.engagement_name).toBe("Nouveau nom");
      }),
    );

    it(
      "rejette la création d'un engagement dont l'identifiant existe déjà",
      createIntegrationTest(async () => {
        // Given
        await fixtures.metadataEngagement({ engagement_id: "98" });

        // When
        const exécuter = () =>
          handler.execute({
            engagementId: "98",
            engagementShort: "ENG-98-DOUBLON",
            engagementName: "Doublon",
            estUneCréation: true,
          });

        // Then
        await expect(exécuter).rejects.toThrow(BadRequestError);
      }),
    );

    it(
      "rejette la création d'un engagement dont l'identifiant existe déjà, même archivé",
      createIntegrationTest(async () => {
        // Given
        await fixtures.metadataEngagement({
          engagement_id: "99",
          deleted_at: new Date("2026-01-01"),
        });

        // When
        const exécuter = () =>
          handler.execute({
            engagementId: "99",
            engagementShort: "ENG-99-DOUBLON",
            engagementName: "Doublon archivé",
            estUneCréation: true,
          });

        // Then
        await expect(exécuter).rejects.toThrow(BadRequestError);
      }),
    );
  });
});
