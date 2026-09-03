import { PrismaPilote } from "@/server/db/PrismaPilote";
import { RestorerAxeHandler } from "@/server/metadataAxe/handlers/RestorerAxeHandler";
import { createIntegrationTest } from "@/server/infrastructure/test/createIntegrationTest";
import { fixtures } from "@/server/infrastructure/test/fixtures";
import { getPrisma } from "@/server/db/PrismaTransaction";

describe("RestorerAxeHandler", () => {
  let handler: RestorerAxeHandler;
  const prismaPilote = new PrismaPilote();

  beforeEach(() => {
    handler = new RestorerAxeHandler({ prisma: prismaPilote });
  });

  describe("execute", () => {
    it(
      "restaure un axe supprimé",
      createIntegrationTest(async () => {
        // Given
        const axe = await fixtures.metadataAxe({
          axe_id: "AXE-99011",
          deleted_at: new Date("2026-01-01"),
        });

        // When
        await handler.execute({ axeId: axe.axe_id });

        // Then
        const result = await getPrisma().metadata_axes.findUniqueOrThrow({
          where: { axe_id: "AXE-99011" },
        });
        expect(result.deleted_at).toBeNull();
      }),
    );
  });
});
