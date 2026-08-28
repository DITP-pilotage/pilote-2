import { PrismaPilote } from "@/server/db/PrismaPilote";
import { VerifierUtilisationZonegroupQuery } from "@/server/metadataZonegroup/queries/VerifierUtilisationZonegroupQuery";
import { createIntegrationTest } from "@/server/infrastructure/test/createIntegrationTest";
import { fixtures } from "@/server/infrastructure/test/fixtures";

describe("VerifierUtilisationZonegroupQuery", () => {
  let query: VerifierUtilisationZonegroupQuery;
  const prismaPilote = new PrismaPilote();

  beforeEach(() => {
    query = new VerifierUtilisationZonegroupQuery({ prisma: prismaPilote });
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
        await fixtures.metadataIndicateur({
          zg_applicable: zonegroup.zone_group_id,
        });
        await fixtures.metadataIndicateur({
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
