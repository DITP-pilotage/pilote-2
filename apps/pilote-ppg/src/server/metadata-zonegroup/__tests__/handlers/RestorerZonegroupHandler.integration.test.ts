import { PrismaPilote } from "@/server/framework/persistence/PrismaPilote";
import { RestorerZonegroupHandler } from "@/server/metadata-zonegroup/handlers/RestorerZonegroupHandler";
import { createIntegrationTest } from "@/test/createIntegrationTest";
import { fixtures } from "@/test/fixtures";
import { getPrisma } from "@/server/framework/persistence/PrismaTransaction";

describe("RestorerZonegroupHandler", () => {
  let handler: RestorerZonegroupHandler;
  const prismaPilote = new PrismaPilote();

  beforeEach(() => {
    handler = new RestorerZonegroupHandler({ prisma: prismaPilote });
  });

  describe("execute", () => {
    it(
      "restaure un zone group supprimé",
      createIntegrationTest(async () => {
        // Given
        await fixtures.metadataZonegroup({
          zone_group_id: "ZG-091",
          deleted_at: new Date("2026-01-01"),
        });

        // When
        await handler.execute({ zoneGroupId: "ZG-091" });

        // Then
        const result = await getPrisma().metadata_zonegroup.findUniqueOrThrow({
          where: { zone_group_id: "ZG-091" },
        });
        expect(result.deleted_at).toBeNull();
      }),
    );
  });
});
