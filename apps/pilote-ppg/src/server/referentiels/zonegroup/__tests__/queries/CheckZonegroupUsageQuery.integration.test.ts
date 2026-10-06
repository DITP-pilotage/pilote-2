import { PrismaPilote } from "@/server/framework/persistence/PrismaPilote";
import { CheckZonegroupUsageQuery } from "@/server/referentiels/zonegroup/queries/CheckZonegroupUsageQuery";
import { createIntegrationTest } from "@/test/createIntegrationTest";
import { fixtures } from "@/test/fixtures";

describe("CheckZonegroupUsageQuery", () => {
  let query: CheckZonegroupUsageQuery;
  const prismaPilote = new PrismaPilote();

  beforeEach(() => {
    query = new CheckZonegroupUsageQuery({ prisma: prismaPilote });
  });

  describe("run", () => {
    it(
      "retourne estUtilise à false quand aucun chantier ni indicateur n'est associé à la zone-groupe",
      createIntegrationTest(async () => {
        // Given
        const zonegroup = await fixtures.metadataZonegroup({
          zone_group_id: "ZG-091",
        });

        // When
        const resultat = await query.run({
          zoneGroupId: zonegroup.zone_group_id,
        });

        // Then
        expect(resultat).toEqual({
          estUtilise: false,
          nombreChantiers: 0,
          nombreIndicateurs: 0,
        });
      }),
    );

    it(
      "retourne estUtilise à true avec le nombre de chantiers et d'indicateurs associés à la zone-groupe",
      createIntegrationTest(async () => {
        // Given
        const zonegroup = await fixtures.metadataZonegroup({
          zone_group_id: "ZG-092",
        });
        await fixtures.metadataChantier({
          zg_applicable: zonegroup.zone_group_id,
        });
        await fixtures.metadataIndicateurHidden({
          zg_applicable: zonegroup.zone_group_id,
        });
        await fixtures.metadataIndicateurHidden({
          zg_applicable: zonegroup.zone_group_id,
        });

        // When
        const resultat = await query.run({
          zoneGroupId: zonegroup.zone_group_id,
        });

        // Then
        expect(resultat).toEqual({
          estUtilise: true,
          nombreChantiers: 1,
          nombreIndicateurs: 2,
        });
      }),
    );
  });
});
