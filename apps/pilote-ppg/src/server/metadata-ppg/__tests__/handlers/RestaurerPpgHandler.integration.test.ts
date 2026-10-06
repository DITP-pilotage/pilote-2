import { PrismaPilote } from "@/server/framework/persistence/PrismaPilote";
import { RestaurerPpgHandler } from "@/server/metadata-ppg/handlers/RestaurerPpgHandler";
import { createIntegrationTest } from "@/test/createIntegrationTest";
import { fixtures } from "@/test/fixtures";
import { getPrisma } from "@/server/framework/persistence/PrismaTransaction";

describe("RestaurerPpgHandler", () => {
  let handler: RestaurerPpgHandler;
  const prismaPilote = new PrismaPilote();

  beforeEach(() => {
    handler = new RestaurerPpgHandler({ prisma: prismaPilote });
  });

  describe("execute", () => {
    it(
      "restaure un PPG supprimé",
      createIntegrationTest(async () => {
        // Given
        const ppg = await fixtures.metadataPpg({
          ppg_id: "PPG-99011",
          deleted_at: new Date("2026-01-01"),
        });

        // When
        await handler.execute({ ppgId: ppg.ppg_id });

        // Then
        const result = await getPrisma().metadata_ppgs.findUniqueOrThrow({
          where: { ppg_id: "PPG-99011" },
        });
        expect(result.deleted_at).toBeNull();
      }),
    );
  });
});
