import { PrismaPilote } from "@/server/db/PrismaPilote";
import { SupprimerPerimetreHandler } from "@/server/metadataPerimetre/handlers/SupprimerPerimetreHandler";
import { createIntegrationTest } from "@/server/infrastructure/test/createIntegrationTest";
import { fixtures } from "@/server/infrastructure/test/fixtures";
import { getPrisma } from "@/server/db/PrismaTransaction";

describe("SupprimerPerimetreHandler", () => {
  let handler: SupprimerPerimetreHandler;
  const prismaPilote = new PrismaPilote();

  beforeEach(() => {
    handler = new SupprimerPerimetreHandler({ prisma: prismaPilote });
  });

  describe("execute", () => {
    it(
      "pose deleted_at sur le périmètre",
      createIntegrationTest(async () => {
        // Given
        const perimetre = await fixtures.metadataPerimetre({ perimetre_id: "PER-090" });

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
      "restaure un périmètre supprimé",
      createIntegrationTest(async () => {
        // Given
        await fixtures.metadataPerimetre({
          perimetre_id: "PER-091",
          deleted_at: new Date("2026-01-01"),
        });

        // When
        await handler.execute({ perimetreId: "PER-091", restaurer: true });

        // Then
        const result = await getPrisma().metadata_perimetres.findUniqueOrThrow({
          where: { perimetre_id: "PER-091" },
        });
        expect(result.deleted_at).toBeNull();
      }),
    );
  });
});
