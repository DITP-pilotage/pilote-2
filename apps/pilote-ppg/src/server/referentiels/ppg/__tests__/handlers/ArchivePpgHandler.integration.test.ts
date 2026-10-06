import { PrismaPilote } from "@/server/framework/persistence/PrismaPilote";
import { ArchivePpgHandler } from "@/server/referentiels/ppg/handlers/ArchivePpgHandler";
import { CheckPpgUsageQuery } from "@/server/referentiels/ppg/queries/CheckPpgUsageQuery";
import { createIntegrationTest } from "@/test/createIntegrationTest";
import { fixtures } from "@/test/fixtures";
import { getPrisma } from "@/server/framework/persistence/PrismaTransaction";
import { ConflictError } from "@/server/app/error-boundary/conflict-error";

describe("ArchivePpgHandler", () => {
  let handler: ArchivePpgHandler;
  const prismaPilote = new PrismaPilote();

  beforeEach(() => {
    handler = new ArchivePpgHandler({
      prisma: prismaPilote,
      checkPpgUsageQuery: new CheckPpgUsageQuery({
        prisma: prismaPilote,
      }),
    });
  });

  describe("execute", () => {
    it(
      "pose deleted_at sur le PPG",
      createIntegrationTest(async () => {
        // Given
        const ppg = await fixtures.metadataPpg({ ppg_id: "PPG-99010" });

        // When
        await handler.execute({ ppgId: ppg.ppg_id });

        // Then
        const result = await getPrisma().metadata_ppgs.findUniqueOrThrow({
          where: { ppg_id: "PPG-99010" },
        });
        expect(result.deleted_at).not.toBeNull();
      }),
    );

    it(
      "lève une ConflictError et ne supprime pas le PPG s'il est associé à un chantier",
      createIntegrationTest(async () => {
        // Given
        const ppg = await fixtures.metadataPpg({ ppg_id: "PPG-99011" });
        await fixtures.metadataChantier({ ch_ppg: ppg.ppg_id });

        // When
        const execute = () => handler.execute({ ppgId: ppg.ppg_id });

        // Then
        await expect(execute).rejects.toThrow(ConflictError);
        const result = await getPrisma().metadata_ppgs.findUniqueOrThrow({
          where: { ppg_id: "PPG-99011" },
        });
        expect(result.deleted_at).toBeNull();
      }),
    );
  });
});
