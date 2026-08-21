import { PrismaPilote } from "@/server/db/PrismaPilote";
import { RestorerZonegroupHandler } from "@/server/metadataZonegroup/handlers/RestorerZonegroupHandler";
import { createIntegrationTest } from "@/server/infrastructure/test/createIntegrationTest";
import { fixtures } from "@/server/infrastructure/test/fixtures";
import { getPrisma } from "@/server/db/PrismaTransaction";

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
