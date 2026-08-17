import { PrismaPilote } from "@/server/db/PrismaPilote";
import { SupprimerZonegroupHandler } from "@/server/metadataZonegroup/handlers/SupprimerZonegroupHandler";
import { createIntegrationTest } from "@/server/infrastructure/test/createIntegrationTest";
import { fixtures } from "@/server/infrastructure/test/fixtures";
import { getPrisma } from "@/server/db/PrismaTransaction";

describe("SupprimerZonegroupHandler", () => {
  let handler: SupprimerZonegroupHandler;
  const prismaPilote = new PrismaPilote();

  beforeEach(() => {
    handler = new SupprimerZonegroupHandler({ prisma: prismaPilote });
  });

  describe("execute", () => {
    it(
      "pose deleted_at sur le zone group",
      createIntegrationTest(async () => {
        // Given
        const zonegroup = await fixtures.metadataZonegroup({ zone_group_id: "ZG-090" });

        // When
        await handler.execute({ zoneGroupId: zonegroup.zone_group_id });

        // Then
        const result = await getPrisma().metadata_zonegroup.findUniqueOrThrow({
          where: { zone_group_id: "ZG-090" },
        });
        expect(result.deleted_at).not.toBeNull();
      }),
    );

    it(
      "restaure un zone group supprimé",
      createIntegrationTest(async () => {
        // Given
        await fixtures.metadataZonegroup({
          zone_group_id: "ZG-091",
          deleted_at: new Date("2026-01-01"),
        });

        // When
        await handler.execute({ zoneGroupId: "ZG-091", restaurer: true });

        // Then
        const result = await getPrisma().metadata_zonegroup.findUniqueOrThrow({
          where: { zone_group_id: "ZG-091" },
        });
        expect(result.deleted_at).toBeNull();
      }),
    );
  });
});
