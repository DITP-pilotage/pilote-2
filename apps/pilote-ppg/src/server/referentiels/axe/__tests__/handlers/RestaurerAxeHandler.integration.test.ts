import { PrismaPilote } from "@/server/framework/persistence/PrismaPilote";
import { RestaurerAxeHandler } from "@/server/referentiels/axe/handlers/RestaurerAxeHandler";
import { createIntegrationTest } from "@/test/createIntegrationTest";
import { fixtures } from "@/test/fixtures";
import { getPrisma } from "@/server/framework/persistence/PrismaTransaction";

describe("RestaurerAxeHandler", () => {
  let handler: RestaurerAxeHandler;
  const prismaPilote = new PrismaPilote();

  beforeEach(() => {
    handler = new RestaurerAxeHandler({ prisma: prismaPilote });
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
