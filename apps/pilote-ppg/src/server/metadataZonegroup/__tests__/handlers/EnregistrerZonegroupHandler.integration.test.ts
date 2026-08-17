import { PrismaPilote } from "@/server/db/PrismaPilote";
import { EnregistrerZonegroupHandler } from "@/server/metadataZonegroup/handlers/EnregistrerZonegroupHandler";
import { createIntegrationTest } from "@/server/infrastructure/test/createIntegrationTest";
import { fixtures } from "@/server/infrastructure/test/fixtures";
import { getPrisma } from "@/server/db/PrismaTransaction";

describe("EnregistrerZonegroupHandler", () => {
  let handler: EnregistrerZonegroupHandler;
  const prismaPilote = new PrismaPilote();

  beforeEach(() => {
    handler = new EnregistrerZonegroupHandler({ prisma: prismaPilote });
  });

  describe("execute", () => {
    it(
      "crée un nouveau zone group",
      createIntegrationTest(async () => {
        // When
        await handler.execute({
          zoneGroupId: "ZG-099",
          zgName: "Zone test",
          zgDesc: "Description test",
          zgZones: ["D01", "D02", "D03"],
        });

        // Then
        const zonegroup = await getPrisma().metadata_zonegroup.findUniqueOrThrow({
          where: { zone_group_id: "ZG-099" },
        });
        expect(zonegroup.zg_name).toBe("Zone test");
        expect(zonegroup.zg_zones).toEqual(["D01", "D02", "D03"]);
        expect(zonegroup.zg_desc).toBe("Description test");
        expect(zonegroup.deleted_at).toBeNull();
      }),
    );

    it(
      "crée un zone group sans description",
      createIntegrationTest(async () => {
        // When
        await handler.execute({
          zoneGroupId: "ZG-098",
          zgName: "Zone sans desc",
          zgDesc: null,
          zgZones: ["FRANCE"],
        });

        // Then
        const zonegroup = await getPrisma().metadata_zonegroup.findUniqueOrThrow({
          where: { zone_group_id: "ZG-098" },
        });
        expect(zonegroup.zg_desc).toBeNull();
      }),
    );

    it(
      "met à jour un zone group existant",
      createIntegrationTest(async () => {
        // Given
        await fixtures.metadataZonegroup({ zone_group_id: "ZG-097", zg_name: "Ancien nom" });

        // When
        await handler.execute({
          zoneGroupId: "ZG-097",
          zgName: "Nouveau nom",
          zgDesc: null,
          zgZones: ["D10", "D20"],
        });

        // Then
        const zonegroup = await getPrisma().metadata_zonegroup.findUniqueOrThrow({
          where: { zone_group_id: "ZG-097" },
        });
        expect(zonegroup.zg_name).toBe("Nouveau nom");
        expect(zonegroup.zg_zones).toEqual(["D10", "D20"]);
      }),
    );
  });
});
