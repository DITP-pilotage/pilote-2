import { PrismaPilote } from "@/server/db/PrismaPilote";
import { RecupererIdSuivantZonegroupQuery } from "@/server/metadataZonegroup/queries/RecupererIdSuivantZonegroupQuery";
import { createIntegrationTest } from "@/server/infrastructure/test/createIntegrationTest";
import { fixtures } from "@/server/infrastructure/test/fixtures";

describe("RecupererIdSuivantZonegroupQuery", () => {
  let query: RecupererIdSuivantZonegroupQuery;
  const prismaPilote = new PrismaPilote();

  beforeEach(() => {
    query = new RecupererIdSuivantZonegroupQuery({ prisma: prismaPilote });
  });

  describe("run", () => {
    it(
      "retourne ZG-001 si aucun zone group",
      createIntegrationTest(async () => {
        // When
        const resultat = await query.run();

        // Then
        expect(resultat).toBe("ZG-001");
      }),
    );

    it(
      "retourne le prochain ID en format ZG-XXX",
      createIntegrationTest(async () => {
        // Given
        await fixtures.metadataZonegroup({ zone_group_id: "ZG-005" });
        await fixtures.metadataZonegroup({ zone_group_id: "ZG-012" });

        // When
        const resultat = await query.run();

        // Then
        expect(resultat).toBe("ZG-013");
      }),
    );

    it(
      "ignore ZG-REF dans le calcul du max",
      createIntegrationTest(async () => {
        // Given — ZG-REF est un identifiant spécial qui ne doit pas influencer la séquence
        await fixtures.metadataZonegroup({ zone_group_id: "ZG-REF" });
        await fixtures.metadataZonegroup({ zone_group_id: "ZG-003" });

        // When
        const resultat = await query.run();

        // Then
        expect(resultat).toBe("ZG-004");
      }),
    );
  });
});
