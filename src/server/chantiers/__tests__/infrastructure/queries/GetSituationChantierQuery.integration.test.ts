import { createIntegrationTest } from "@/server/infrastructure/test/createIntegrationTest";
import { fixtures } from "@/server/infrastructure/test/fixtures";
import { PrismaPilote } from "@/server/db/PrismaPilote";
import { GetSituationChantierQuery } from "@/server/chantiers/infrastructure/queries/GetSituationChantierQuery";

describe("GetSituationChantierQuery", () => {
  let query: GetSituationChantierQuery;

  beforeEach(() => {
    query = new GetSituationChantierQuery({
      prisma: new PrismaPilote(),
    });
  });

  it(
    "retourne ecart, tendance et valeurs précédentes",
    createIntegrationTest(async () => {
      // Given
      await fixtures.chantierIdentite({ id: "CH-001" });
      await fixtures.chantierTerritoire({
        id: "CH-001",
        territoire_code: "DEPT-75",
        code_insee: "75",
        maille: "DEPT",
        zone_id: "zone-1",
        tendance: "HAUSSE",
        taux_avancement_mandat_valeur_precedente: 35.0,
        date_taux_avancement_mandat_valeur_precedente: new Date("2024-12-15"),
      });
      await fixtures.chantierTerritoireJalon({
        id: "CH-001",
        territoire_code: "DEPT-75",
        code_insee: "75",
        maille: "DEPT",
        zone_id: "zone-1",
        jalon: 2025,
        taux_avancement: 42.5,
        ecart: 5.3,
      });

      // When
      const result = await query.execute({
        chantierId: "CH-001",
        jalon: 2025,
        territoireCode: "DEPT-75",
      });

      // Then
      expect(result).toEqual(
        expect.objectContaining({
          ecart: 5.3,
          tendance: "HAUSSE",
          tauxAvancementPrecedent: 35.0,
        }),
      );
      expect(result.dateTauxAvancementPrecedent).not.toBeNull();
    }),
  );

  it(
    "retourne null pour ecart et tendance quand non renseignés",
    createIntegrationTest(async () => {
      // Given
      await fixtures.chantierIdentite({ id: "CH-002" });
      await fixtures.chantierTerritoire({
        id: "CH-002",
        territoire_code: "NAT-FR",
        code_insee: "FR",
        maille: "NAT",
        zone_id: "zone-1",
        tendance: null,
        taux_avancement_mandat_valeur_precedente: null,
        date_taux_avancement_mandat_valeur_precedente: null,
      });
      await fixtures.chantierTerritoireJalon({
        id: "CH-002",
        territoire_code: "NAT-FR",
        code_insee: "FR",
        maille: "NAT",
        zone_id: "zone-1",
        jalon: 2025,
        taux_avancement: null,
        ecart: null,
      });

      // When
      const result = await query.execute({
        chantierId: "CH-002",
        jalon: 2025,
        territoireCode: "NAT-FR",
      });

      // Then
      expect(result).toEqual({
        ecart: null,
        tendance: null,
        tauxAvancementPrecedent: null,
        dateTauxAvancementPrecedent: null,
        mediane: null,
      });
    }),
  );

  it(
    "calcule la médiane correctement avec un nombre impair de territoires",
    createIntegrationTest(async () => {
      // Given
      await fixtures.chantierIdentite({ id: "CH-003" });

      // 3 départements avec des taux d'avancement différents
      const depts = [
        { code: "DEPT-75", insee: "75", taux: 20.0 },
        { code: "DEPT-13", insee: "13", taux: 40.0 },
        { code: "DEPT-69", insee: "69", taux: 60.0 },
      ];

      for (const dept of depts) {
        await fixtures.chantierTerritoire({
          id: "CH-003",
          territoire_code: dept.code,
          code_insee: dept.insee,
          maille: "DEPT",
          zone_id: `zone-${dept.insee}`,
        });
        await fixtures.chantierTerritoireJalon({
          id: "CH-003",
          territoire_code: dept.code,
          code_insee: dept.insee,
          maille: "DEPT",
          zone_id: `zone-${dept.insee}`,
          jalon: 2025,
          taux_avancement: dept.taux,
        });
      }

      // When
      const result = await query.execute({
        chantierId: "CH-003",
        jalon: 2025,
        territoireCode: "DEPT-75",
      });

      // Then — médiane de [20, 40, 60] = 40
      expect(result.mediane).toBe(40.0);
    }),
  );

  it(
    "calcule la médiane correctement avec un nombre pair de territoires",
    createIntegrationTest(async () => {
      // Given
      await fixtures.chantierIdentite({ id: "CH-004" });

      const depts = [
        { code: "DEPT-75", insee: "75", taux: 20.0 },
        { code: "DEPT-13", insee: "13", taux: 40.0 },
        { code: "DEPT-69", insee: "69", taux: 60.0 },
        { code: "DEPT-31", insee: "31", taux: 80.0 },
      ];

      for (const dept of depts) {
        await fixtures.chantierTerritoire({
          id: "CH-004",
          territoire_code: dept.code,
          code_insee: dept.insee,
          maille: "DEPT",
          zone_id: `zone-${dept.insee}`,
        });
        await fixtures.chantierTerritoireJalon({
          id: "CH-004",
          territoire_code: dept.code,
          code_insee: dept.insee,
          maille: "DEPT",
          zone_id: `zone-${dept.insee}`,
          jalon: 2025,
          taux_avancement: dept.taux,
        });
      }

      // When
      const result = await query.execute({
        chantierId: "CH-004",
        jalon: 2025,
        territoireCode: "DEPT-75",
      });

      // Then — médiane de [20, 40, 60, 80] = (40 + 60) / 2 = 50
      expect(result.mediane).toBe(50.0);
    }),
  );
});
