import { PrismaPilote } from "@/server/framework/persistence/PrismaPilote";
import { ArchiveZonegroupHandler } from "@/server/referentiels/zonegroup/handlers/ArchiveZonegroupHandler";
import { CheckZonegroupUsageQuery } from "@/server/referentiels/zonegroup/queries/CheckZonegroupUsageQuery";
import { createIntegrationTest } from "@/test/createIntegrationTest";
import { fixtures } from "@/test/fixtures";
import { getPrisma } from "@/server/framework/persistence/PrismaTransaction";
import { ConflictError } from "@/shared/errors/conflict-error";

describe("ArchiveZonegroupHandler", () => {
  let handler: ArchiveZonegroupHandler;
  const prismaPilote = new PrismaPilote();

  beforeEach(() => {
    handler = new ArchiveZonegroupHandler({
      prisma: prismaPilote,
      checkZonegroupUsageQuery: new CheckZonegroupUsageQuery({
        prisma: prismaPilote,
      }),
    });
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

    it(
      "lève une ConflictError et ne supprime pas la zone-groupe si elle est associée à un chantier",
      createIntegrationTest(async () => {
        // Given
        const zonegroup = await fixtures.metadataZonegroup({
          zone_group_id: "ZG-093",
        });
        await fixtures.metadataChantier({
          zg_applicable: zonegroup.zone_group_id,
        });

        // When
        const execute = () =>
          handler.execute({ zoneGroupId: zonegroup.zone_group_id });

        // Then
        await expect(execute).rejects.toThrow(ConflictError);
        const result = await getPrisma().metadata_zonegroup.findUniqueOrThrow({
          where: { zone_group_id: "ZG-093" },
        });
        expect(result.deleted_at).toBeNull();
      }),
    );

    it(
      "lève une ConflictError et ne supprime pas la zone-groupe si elle est associée à un indicateur",
      createIntegrationTest(async () => {
        // Given
        const zonegroup = await fixtures.metadataZonegroup({
          zone_group_id: "ZG-094",
        });
        await fixtures.metadataIndicateurHidden({
          zg_applicable: zonegroup.zone_group_id,
        });

        // When
        const execute = () =>
          handler.execute({ zoneGroupId: zonegroup.zone_group_id });

        // Then
        await expect(execute).rejects.toThrow(ConflictError);
        const result = await getPrisma().metadata_zonegroup.findUniqueOrThrow({
          where: { zone_group_id: "ZG-094" },
        });
        expect(result.deleted_at).toBeNull();
      }),
    );
  });
});
