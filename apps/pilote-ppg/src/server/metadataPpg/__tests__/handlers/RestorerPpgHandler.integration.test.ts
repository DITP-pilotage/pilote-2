import { PrismaPilote } from "@/server/db/PrismaPilote";
import { RestorerPpgHandler } from "@/server/metadataPpg/handlers/RestorerPpgHandler";
import { createIntegrationTest } from "@/server/infrastructure/test/createIntegrationTest";
import { fixtures } from "@/server/infrastructure/test/fixtures";
import { getPrisma } from "@/server/db/PrismaTransaction";

describe("RestorerPpgHandler", () => {
  let handler: RestorerPpgHandler;
  const prismaPilote = new PrismaPilote();

  beforeEach(() => {
    handler = new RestorerPpgHandler({ prisma: prismaPilote });
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
