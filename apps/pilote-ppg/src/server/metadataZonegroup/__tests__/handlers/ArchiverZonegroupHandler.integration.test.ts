import { PrismaPilote } from "@/server/db/PrismaPilote";
import { ArchiverZonegroupHandler } from "@/server/metadataZonegroup/handlers/ArchiverZonegroupHandler";
import { VerifierUtilisationZonegroupQuery } from "@/server/metadataZonegroup/queries/VerifierUtilisationZonegroupQuery";
import { createIntegrationTest } from "@/server/infrastructure/test/createIntegrationTest";
import { fixtures } from "@/server/infrastructure/test/fixtures";
import { getPrisma } from "@/server/db/PrismaTransaction";
import { ConflictError } from "@/server/app/error-boundary/conflict-error";

describe("ArchiverZonegroupHandler", () => {
  let handler: ArchiverZonegroupHandler;
  const prismaPilote = new PrismaPilote();

  beforeEach(() => {
    handler = new ArchiverZonegroupHandler({
      prisma: prismaPilote,
      verifierUtilisationZonegroupQuery: new VerifierUtilisationZonegroupQuery({
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
        const exécuter = () =>
          handler.execute({ zoneGroupId: zonegroup.zone_group_id });

        // Then
        await expect(exécuter).rejects.toThrow(ConflictError);
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
        const exécuter = () =>
          handler.execute({ zoneGroupId: zonegroup.zone_group_id });

        // Then
        await expect(exécuter).rejects.toThrow(ConflictError);
        const result = await getPrisma().metadata_zonegroup.findUniqueOrThrow({
          where: { zone_group_id: "ZG-094" },
        });
        expect(result.deleted_at).toBeNull();
      }),
    );
  });
});
