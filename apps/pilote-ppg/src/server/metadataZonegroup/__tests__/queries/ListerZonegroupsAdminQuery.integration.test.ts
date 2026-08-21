import { PrismaPilote } from "@/server/db/PrismaPilote";
import { ListerZonegroupsAdminQuery } from "@/server/metadataZonegroup/queries/ListerZonegroupsAdminQuery";
import { createIntegrationTest } from "@/server/infrastructure/test/createIntegrationTest";
import { fixtures } from "@/server/infrastructure/test/fixtures";

describe("ListerZonegroupsAdminQuery", () => {
  let query: ListerZonegroupsAdminQuery;
  const prismaPilote = new PrismaPilote();

  beforeEach(() => {
    query = new ListerZonegroupsAdminQuery({ prisma: prismaPilote });
  });

  describe("run", () => {
    it(
      "retourne tous les zone groups y compris les supprimés avec nbZones calculé",
      createIntegrationTest(async () => {
        // Given
        await fixtures.metadataZonegroup({
          zone_group_id: "ZG-080",
          zg_name: "Actif",
          // 3 zones
          zg_zones: ["D01", "D02", "D03"],
        });
        await fixtures.metadataZonegroup({
          zone_group_id: "ZG-081",
          zg_name: "Supprimé",
          zg_zones: ["FRANCE"],
          deleted_at: new Date("2026-01-01"),
        });

        // When
        const resultat = await query.run();

        // Then
        const ids = resultat.map((z) => z.zoneGroupId);
        expect(ids).toContain("ZG-080");
        expect(ids).toContain("ZG-081");
        const actif = resultat.find((z) => z.zoneGroupId === "ZG-080");
        expect(actif?.nbZones).toBe(3);
        const supprime = resultat.find((z) => z.zoneGroupId === "ZG-081");
        expect(supprime?.deletedAt).not.toBeNull();
      }),
    );
  });
});
