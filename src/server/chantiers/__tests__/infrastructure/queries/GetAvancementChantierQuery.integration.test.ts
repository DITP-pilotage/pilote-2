import { createIntegrationTest } from "@/server/infrastructure/test/createIntegrationTest";
import { fixtures } from "@/server/infrastructure/test/fixtures";
import { PrismaPilote } from "@/server/db/PrismaPilote";
import { GetAvancementChantierQuery } from "@/server/chantiers/infrastructure/queries/GetAvancementChantierQuery";

describe("GetAvancementChantierQuery", () => {
  let query: GetAvancementChantierQuery;

  beforeEach(() => {
    query = new GetAvancementChantierQuery({
      prisma: new PrismaPilote(),
    });
  });

  it(
    "retourne 3 entrées pour un territoire DEPT (DEPT + REG parent + NAT-FR)",
    createIntegrationTest(async () => {
      // Given
      await fixtures.chantierIdentite({ id: "CH-001" });
      await fixtures.chantierTerritoire({
        id: "CH-001",
        territoire_code: "DEPT-75",
        code_insee: "75",
        maille: "DEPT",
        zone_id: "zone-1",
      });
      await fixtures.chantierTerritoireJalon({
        id: "CH-001",
        territoire_code: "DEPT-75",
        code_insee: "75",
        maille: "DEPT",
        zone_id: "zone-1",
        jalon: 2025,
        taux_avancement: 42.5,
        date_taux_avancement: new Date("2025-03-15"),
      });
      await fixtures.chantierTerritoire({
        id: "CH-001",
        territoire_code: "REG-11",
        code_insee: "11",
        maille: "REG",
        zone_id: "zone-2",
      });
      await fixtures.chantierTerritoireJalon({
        id: "CH-001",
        territoire_code: "REG-11",
        code_insee: "11",
        maille: "REG",
        zone_id: "zone-2",
        jalon: 2025,
        taux_avancement: 55.0,
        date_taux_avancement: new Date("2025-03-10"),
      });
      await fixtures.chantierTerritoire({
        id: "CH-001",
        territoire_code: "NAT-FR",
        code_insee: "FR",
        maille: "NAT",
        zone_id: "zone-3",
      });
      await fixtures.chantierTerritoireJalon({
        id: "CH-001",
        territoire_code: "NAT-FR",
        code_insee: "FR",
        maille: "NAT",
        zone_id: "zone-3",
        jalon: 2025,
        taux_avancement: 60.0,
        date_taux_avancement: new Date("2025-03-01"),
      });

      // When
      const result = await query.execute({
        chantierId: "CH-001",
        jalon: 2025,
        territoireCode: "DEPT-75",
      });

      // Then
      expect(result).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            territoireCode: "DEPT-75",
            maille: "DEPT",
            tauxAvancement: 42.5,
          }),
          expect.objectContaining({
            territoireCode: "REG-11",
            maille: "REG",
            tauxAvancement: 55.0,
          }),
          expect.objectContaining({
            territoireCode: "NAT-FR",
            maille: "NAT",
            tauxAvancement: 60.0,
          }),
        ]),
      );
      expect(result).toHaveLength(3);
    }),
  );

  it(
    "retourne 2 entrées pour un territoire REG (REG + NAT-FR)",
    createIntegrationTest(async () => {
      // Given
      await fixtures.chantierIdentite({ id: "CH-002" });
      await fixtures.chantierTerritoire({
        id: "CH-002",
        territoire_code: "REG-11",
        code_insee: "11",
        maille: "REG",
        zone_id: "zone-1",
      });
      await fixtures.chantierTerritoireJalon({
        id: "CH-002",
        territoire_code: "REG-11",
        code_insee: "11",
        maille: "REG",
        zone_id: "zone-1",
        jalon: 2025,
        taux_avancement: 55.0,
      });
      await fixtures.chantierTerritoire({
        id: "CH-002",
        territoire_code: "NAT-FR",
        code_insee: "FR",
        maille: "NAT",
        zone_id: "zone-2",
      });
      await fixtures.chantierTerritoireJalon({
        id: "CH-002",
        territoire_code: "NAT-FR",
        code_insee: "FR",
        maille: "NAT",
        zone_id: "zone-2",
        jalon: 2025,
        taux_avancement: 60.0,
      });

      // When
      const result = await query.execute({
        chantierId: "CH-002",
        jalon: 2025,
        territoireCode: "REG-11",
      });

      // Then
      expect(result).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            territoireCode: "REG-11",
            maille: "REG",
            tauxAvancement: 55.0,
          }),
          expect.objectContaining({
            territoireCode: "NAT-FR",
            maille: "NAT",
            tauxAvancement: 60.0,
          }),
        ]),
      );
      expect(result).toHaveLength(2);
    }),
  );

  it(
    "retourne 1 entrée pour NAT-FR",
    createIntegrationTest(async () => {
      // Given
      await fixtures.chantierIdentite({ id: "CH-003" });
      await fixtures.chantierTerritoire({
        id: "CH-003",
        territoire_code: "NAT-FR",
        code_insee: "FR",
        maille: "NAT",
        zone_id: "zone-1",
      });
      await fixtures.chantierTerritoireJalon({
        id: "CH-003",
        territoire_code: "NAT-FR",
        code_insee: "FR",
        maille: "NAT",
        zone_id: "zone-1",
        jalon: 2025,
        taux_avancement: 70.0,
      });

      // When
      const result = await query.execute({
        chantierId: "CH-003",
        jalon: 2025,
        territoireCode: "NAT-FR",
      });

      // Then
      expect(result).toEqual([
        expect.objectContaining({
          territoireCode: "NAT-FR",
          maille: "NAT",
          tauxAvancement: 70.0,
        }),
      ]);
    }),
  );

  it(
    "retourne null pour taux_avancement quand il n'est pas renseigné",
    createIntegrationTest(async () => {
      // Given
      await fixtures.chantierIdentite({ id: "CH-004" });
      await fixtures.chantierTerritoire({
        id: "CH-004",
        territoire_code: "NAT-FR",
        code_insee: "FR",
        maille: "NAT",
        zone_id: "zone-1",
      });
      await fixtures.chantierTerritoireJalon({
        id: "CH-004",
        territoire_code: "NAT-FR",
        code_insee: "FR",
        maille: "NAT",
        zone_id: "zone-1",
        jalon: 2025,
        taux_avancement: null,
      });

      // When
      const result = await query.execute({
        chantierId: "CH-004",
        jalon: 2025,
        territoireCode: "NAT-FR",
      });

      // Then
      expect(result).toEqual([
        expect.objectContaining({
          tauxAvancement: null,
          dateTauxAvancement: null,
        }),
      ]);
    }),
  );
});
