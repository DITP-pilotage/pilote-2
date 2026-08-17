import { PrismaPilote } from "@/server/db/PrismaPilote";
import { ListerZonegroupsQuery } from "@/server/metadataChantier/queries/ListerZonegroupsQuery";
import { createIntegrationTest } from "@/server/infrastructure/test/createIntegrationTest";
import { getPrisma } from "@/server/db/PrismaTransaction";
import { fixtures } from "@/server/infrastructure/test/fixtures";

describe("ListerZonegroupsQuery", () => {
  let query: ListerZonegroupsQuery;
  const prismaPilote = new PrismaPilote();

  beforeEach(() => {
    query = new ListerZonegroupsQuery({ prisma: prismaPilote });
  });

  describe("run", () => {
    it(
      "retourne un tableau vide si aucun zonegroup",
      createIntegrationTest(async () => {
        // Given

        // When
        const resultat = await query.run();

        // Then
        expect(resultat).toEqual([]);
      }),
    );

    it(
      "retourne les zonegroups triés par zone_group_id",
      createIntegrationTest(async () => {
        // Given
        const prisma = getPrisma();
        await prisma.metadata_zonegroup.create({
          data: { zone_group_id: "ZG-C", zg_name: "Zone C", zg_zones: [] },
        });
        await prisma.metadata_zonegroup.create({
          data: { zone_group_id: "ZG-A", zg_name: "Zone A", zg_zones: [] },
        });
        await prisma.metadata_zonegroup.create({
          data: { zone_group_id: "ZG-B", zg_name: "Zone B", zg_zones: [] },
        });

        // When
        const resultat = await query.run();

        // Then
        expect(resultat).toEqual([
          { id: "ZG-A", nom: "Zone A" },
          { id: "ZG-B", nom: "Zone B" },
          { id: "ZG-C", nom: "Zone C" },
        ]);
      }),
    );

    it(
      "exclut les zonegroups supprimés",
      createIntegrationTest(async () => {
        // Given
        await fixtures.metadataZonegroup({ zone_group_id: "ZG-010", zg_name: "Actif" });
        await fixtures.metadataZonegroup({
          zone_group_id: "ZG-011",
          zg_name: "Supprimé",
          deleted_at: new Date("2026-01-01"),
        });

        // When
        const resultat = await query.run();

        // Then
        const ids = resultat.map((z) => z.id);
        expect(ids).toContain("ZG-010");
        expect(ids).not.toContain("ZG-011");
      }),
    );
  });
});
