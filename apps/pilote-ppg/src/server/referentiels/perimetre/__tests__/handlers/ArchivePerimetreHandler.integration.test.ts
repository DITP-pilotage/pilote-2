import { PrismaPilote } from "@/server/framework/persistence/PrismaPilote";
import { ArchivePerimetreHandler } from "@/server/referentiels/perimetre/handlers/ArchivePerimetreHandler";
import { CheckPerimetreUsageQuery } from "@/server/referentiels/perimetre/queries/CheckPerimetreUsageQuery";
import { createIntegrationTest } from "@/test/createIntegrationTest";
import { fixtures } from "@/test/fixtures";
import { getPrisma } from "@/server/framework/persistence/PrismaTransaction";
import { ConflictError } from "@/server/app/error-boundary/conflict-error";

describe("ArchivePerimetreHandler", () => {
  let handler: ArchivePerimetreHandler;
  const prismaPilote = new PrismaPilote();

  beforeEach(() => {
    handler = new ArchivePerimetreHandler({
      prisma: prismaPilote,
      checkPerimetreUsageQuery: new CheckPerimetreUsageQuery({
        prisma: prismaPilote,
      }),
    });
  });

  describe("execute", () => {
    it(
      "pose deleted_at sur le périmètre",
      createIntegrationTest(async () => {
        // Given
        const perimetre = await fixtures.metadataPerimetre({
          perimetre_id: "PER-090",
        });

        // When
        await handler.execute({ perimetreId: perimetre.perimetre_id });

        // Then
        const result = await getPrisma().metadata_perimetres.findUniqueOrThrow({
          where: { perimetre_id: "PER-090" },
        });
        expect(result.deleted_at).not.toBeNull();
      }),
    );

    it(
      "lève une ConflictError et ne supprime pas le périmètre s'il est associé à un chantier",
      createIntegrationTest(async () => {
        // Given
        const perimetre = await fixtures.metadataPerimetre({
          perimetre_id: "PER-093",
        });
        await fixtures.metadataChantier({ ch_per: perimetre.perimetre_id });

        // When
        const execute = () =>
          handler.execute({ perimetreId: perimetre.perimetre_id });

        // Then
        await expect(execute).rejects.toThrow(ConflictError);
        const result = await getPrisma().metadata_perimetres.findUniqueOrThrow({
          where: { perimetre_id: "PER-093" },
        });
        expect(result.deleted_at).toBeNull();
      }),
    );
  });
});
