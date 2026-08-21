import { PrismaPilote } from "@/server/db/PrismaPilote";
import { RestorerPerimetreHandler } from "@/server/metadataPerimetre/handlers/RestorerPerimetreHandler";
import { createIntegrationTest } from "@/server/infrastructure/test/createIntegrationTest";
import { fixtures } from "@/server/infrastructure/test/fixtures";
import { getPrisma } from "@/server/db/PrismaTransaction";

describe("RestorerPerimetreHandler", () => {
  let handler: RestorerPerimetreHandler;
  const prismaPilote = new PrismaPilote();

  beforeEach(() => {
    handler = new RestorerPerimetreHandler({ prisma: prismaPilote });
  });

  describe("execute", () => {
    it(
      "restaure un périmètre supprimé",
      createIntegrationTest(async () => {
        // Given
        await fixtures.metadataPerimetre({
          perimetre_id: "PER-091",
          deleted_at: new Date("2026-01-01"),
        });

        // When
        await handler.execute({ perimetreId: "PER-091" });

        // Then
        const result = await getPrisma().metadata_perimetres.findUniqueOrThrow({
          where: { perimetre_id: "PER-091" },
        });
        expect(result.deleted_at).toBeNull();
      }),
    );
  });
});
