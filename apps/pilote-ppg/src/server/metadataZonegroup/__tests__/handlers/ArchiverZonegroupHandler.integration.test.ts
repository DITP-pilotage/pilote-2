import { PrismaPilote } from "@/server/db/PrismaPilote";
import { ArchiverZonegroupHandler } from "@/server/metadataZonegroup/handlers/ArchiverZonegroupHandler";
import { createIntegrationTest } from "@/server/infrastructure/test/createIntegrationTest";
import { fixtures } from "@/server/infrastructure/test/fixtures";
import { getPrisma } from "@/server/db/PrismaTransaction";

describe("ArchiverZonegroupHandler", () => {
  let handler: ArchiverZonegroupHandler;
  const prismaPilote = new PrismaPilote();

  beforeEach(() => {
    handler = new ArchiverZonegroupHandler({ prisma: prismaPilote });
  });

  describe("execute", () => {
    it(
      "pose deleted_at sur le zone group",
      createIntegrationTest(async () => {
        // Given
        const zonegroup = await fixtures.metadataZonegroup({
          zone_group_id: "ZG-090",
        });

        // When
        await handler.execute({ zoneGroupId: zonegroup.zone_group_id });

        // Then
        const result = await getPrisma().metadata_zonegroup.findUniqueOrThrow({
          where: { zone_group_id: "ZG-090" },
        });
        expect(result.deleted_at).not.toBeNull();
      }),
    );
  });
});
