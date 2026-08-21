import { PrismaPilote } from "@/server/db/PrismaPilote";
import { ArchiverPerimetreHandler } from "@/server/metadataPerimetre/handlers/ArchiverPerimetreHandler";
import { createIntegrationTest } from "@/server/infrastructure/test/createIntegrationTest";
import { fixtures } from "@/server/infrastructure/test/fixtures";
import { getPrisma } from "@/server/db/PrismaTransaction";

describe("ArchiverPerimetreHandler", () => {
  let handler: ArchiverPerimetreHandler;
  const prismaPilote = new PrismaPilote();

  beforeEach(() => {
    handler = new ArchiverPerimetreHandler({ prisma: prismaPilote });
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
  });
});
