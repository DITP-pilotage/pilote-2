import { PrismaPilote } from "@/server/framework/persistence/PrismaPilote";
import { ArchiveAxeHandler } from "@/server/referentiels/axe/handlers/ArchiveAxeHandler";
import { CheckAxeUsageQuery } from "@/server/referentiels/axe/queries/CheckAxeUsageQuery";
import { createIntegrationTest } from "@/test/createIntegrationTest";
import { fixtures } from "@/test/fixtures";
import { getPrisma } from "@/server/framework/persistence/PrismaTransaction";
import { ConflictError } from "@/shared/errors/conflict-error";

describe("ArchiveAxeHandler", () => {
  let handler: ArchiveAxeHandler;
  const prismaPilote = new PrismaPilote();

  beforeEach(() => {
    handler = new ArchiveAxeHandler({
      prisma: prismaPilote,
      checkAxeUsageQuery: new CheckAxeUsageQuery({
        prisma: prismaPilote,
      }),
    });
  });

  describe("execute", () => {
    it(
      "pose deleted_at sur l'axe",
      createIntegrationTest(async () => {
        // Given
        const axe = await fixtures.metadataAxe({ axe_id: "AXE-99010" });

        // When
        await handler.execute({ axeId: axe.axe_id });

        // Then
        const result = await getPrisma().metadata_axes.findUniqueOrThrow({
          where: { axe_id: "AXE-99010" },
        });
        expect(result.deleted_at).not.toBeNull();
      }),
    );

    it(
      "lève une ConflictError et ne supprime pas l'axe s'il est associé à un PPG",
      createIntegrationTest(async () => {
        // Given
        const axe = await fixtures.metadataAxe({ axe_id: "AXE-99011" });
        await fixtures.metadataPpg({ ppg_axe: axe.axe_id });

        // When
        const execute = () => handler.execute({ axeId: axe.axe_id });

        // Then
        await expect(execute).rejects.toThrow(ConflictError);
        const result = await getPrisma().metadata_axes.findUniqueOrThrow({
          where: { axe_id: "AXE-99011" },
        });
        expect(result.deleted_at).toBeNull();
      }),
    );
  });
});
