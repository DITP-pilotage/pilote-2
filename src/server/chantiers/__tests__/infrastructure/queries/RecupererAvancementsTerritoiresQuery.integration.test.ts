import { createIntegrationTest } from "@/server/infrastructure/test/createIntegrationTest";
import { fixtures } from "@/server/infrastructure/test/fixtures";
import { RecupererAvancementsTerritoiresQuery } from "@/server/chantiers/infrastructure/queries/RecupererAvancementsTerritoiresQuery";
import { AgregerAvancementsChantiersUseCase } from "@/server/chantiers/usecases/AgregerAvancementsChantiersUseCase";
import { PrismaTerritoireRepository } from "@/server/chantiers/infrastructure/adapters/PrismaTerritoireRepository";
import { PrismaPilote } from "@/server/db/PrismaPilote";
import ChantierSQLRepository from "@/server/infrastructure/accès_données/chantier/ChantierSQLRepository";

const prismaPilote = new PrismaPilote();
let query: RecupererAvancementsTerritoiresQuery;

beforeEach(() => {
  query = new RecupererAvancementsTerritoiresQuery({
    agregerAvancementsChantiersUseCase: new AgregerAvancementsChantiersUseCase({
      chantierRepository: new ChantierSQLRepository({ prisma: prismaPilote }),
    }),
    territoireRepository: new PrismaTerritoireRepository({
      prisma: prismaPilote,
    }),
  });
});

describe("RecupererAvancementsTerritoiresQuery", () => {
  describe("dateTauxAvancementAnnuel", () => {
    it(
      "prend la date la plus récente parmi plusieurs chantiers",
      createIntegrationTest(async () => {
        // given
        await fixtures.chantierIdentite({ id: "CH-001" });
        await fixtures.chantierTerritoire({
          id: "CH-001",
          territoire_code: "DEPT-75",
          maille: "DEPT",
          code_insee: "75",
          zone_id: "zone-1",
          est_applicable: true,
        });
        await fixtures.chantierTerritoireJalon({
          id: "CH-001",
          territoire_code: "DEPT-75",
          maille: "DEPT",
          code_insee: "75",
          zone_id: "zone-1",
          jalon: 2025,
          date_taux_avancement: new Date("2024-01-15T00:00:00.000Z"),
        });

        await fixtures.chantierIdentite({ id: "CH-002" });
        await fixtures.chantierTerritoire({
          id: "CH-002",
          territoire_code: "DEPT-75",
          maille: "DEPT",
          code_insee: "75",
          zone_id: "zone-1",
          est_applicable: true,
        });
        await fixtures.chantierTerritoireJalon({
          id: "CH-002",
          territoire_code: "DEPT-75",
          maille: "DEPT",
          code_insee: "75",
          zone_id: "zone-1",
          jalon: 2025,
          date_taux_avancement: new Date("2024-07-15T00:00:00.000Z"),
        });

        // when
        const result = await query.run({
          chantierIds: ["CH-001", "CH-002"],
          jalon: 2025,
        });

        // then
        expect(result).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              territoireCode: "DEPT-75",
              dateTauxAvancementAnnuel: "2024-07-15T00:00:00.000Z",
            }),
          ]),
        );
      }),
    );

    it(
      "retourne null si aucun chantier n'a de date",
      createIntegrationTest(async () => {
        // given
        await fixtures.chantierIdentite({ id: "CH-003" });
        await fixtures.chantierTerritoire({
          id: "CH-003",
          territoire_code: "DEPT-75",
          maille: "DEPT",
          code_insee: "75",
          zone_id: "zone-1",
          est_applicable: true,
        });
        await fixtures.chantierTerritoireJalon({
          id: "CH-003",
          territoire_code: "DEPT-75",
          maille: "DEPT",
          code_insee: "75",
          zone_id: "zone-1",
          jalon: 2025,
          // pas de date_taux_avancement
        });

        // when
        const result = await query.run({
          chantierIds: ["CH-003"],
          jalon: 2025,
        });

        // then
        expect(result).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              territoireCode: "DEPT-75",
              dateTauxAvancementAnnuel: null,
            }),
          ]),
        );
      }),
    );
  });

  describe("estApplicable", () => {
    it(
      "retourne false si tous les chantiers sont non applicables",
      createIntegrationTest(async () => {
        // given
        await fixtures.chantierIdentite({ id: "CH-004" });
        await fixtures.chantierTerritoire({
          id: "CH-004",
          territoire_code: "DEPT-75",
          maille: "DEPT",
          code_insee: "75",
          zone_id: "zone-1",
          est_applicable: false,
        });
        await fixtures.chantierTerritoireJalon({
          id: "CH-004",
          territoire_code: "DEPT-75",
          maille: "DEPT",
          code_insee: "75",
          zone_id: "zone-1",
          jalon: 2025,
        });

        await fixtures.chantierIdentite({ id: "CH-005" });
        await fixtures.chantierTerritoire({
          id: "CH-005",
          territoire_code: "DEPT-75",
          maille: "DEPT",
          code_insee: "75",
          zone_id: "zone-1",
          est_applicable: false,
        });
        await fixtures.chantierTerritoireJalon({
          id: "CH-005",
          territoire_code: "DEPT-75",
          maille: "DEPT",
          code_insee: "75",
          zone_id: "zone-1",
          jalon: 2025,
        });

        // when
        const result = await query.run({
          chantierIds: ["CH-004", "CH-005"],
          jalon: 2025,
        });

        // then
        expect(result).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              territoireCode: "DEPT-75",
              estApplicable: false,
            }),
          ]),
        );
      }),
    );

    it(
      "retourne true si tous les chantiers sont applicables",
      createIntegrationTest(async () => {
        // given
        await fixtures.chantierIdentite({ id: "CH-008" });
        await fixtures.chantierTerritoire({
          id: "CH-008",
          territoire_code: "DEPT-75",
          maille: "DEPT",
          code_insee: "75",
          zone_id: "zone-1",
          est_applicable: true,
        });
        await fixtures.chantierTerritoireJalon({
          id: "CH-008",
          territoire_code: "DEPT-75",
          maille: "DEPT",
          code_insee: "75",
          zone_id: "zone-1",
          jalon: 2025,
        });

        await fixtures.chantierIdentite({ id: "CH-009" });
        await fixtures.chantierTerritoire({
          id: "CH-009",
          territoire_code: "DEPT-75",
          maille: "DEPT",
          code_insee: "75",
          zone_id: "zone-1",
          est_applicable: true,
        });
        await fixtures.chantierTerritoireJalon({
          id: "CH-009",
          territoire_code: "DEPT-75",
          maille: "DEPT",
          code_insee: "75",
          zone_id: "zone-1",
          jalon: 2025,
        });

        // when
        const result = await query.run({
          chantierIds: ["CH-008", "CH-009"],
          jalon: 2025,
        });

        // then
        expect(result).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              territoireCode: "DEPT-75",
              estApplicable: true,
            }),
          ]),
        );
      }),
    );

    it(
      "retourne null si au moins un chantier est applicable",
      createIntegrationTest(async () => {
        // given
        await fixtures.chantierIdentite({ id: "CH-006" });
        await fixtures.chantierTerritoire({
          id: "CH-006",
          territoire_code: "DEPT-75",
          maille: "DEPT",
          code_insee: "75",
          zone_id: "zone-1",
          est_applicable: false,
        });
        await fixtures.chantierTerritoireJalon({
          id: "CH-006",
          territoire_code: "DEPT-75",
          maille: "DEPT",
          code_insee: "75",
          zone_id: "zone-1",
          jalon: 2025,
        });

        await fixtures.chantierIdentite({ id: "CH-007" });
        await fixtures.chantierTerritoire({
          id: "CH-007",
          territoire_code: "DEPT-75",
          maille: "DEPT",
          code_insee: "75",
          zone_id: "zone-1",
          est_applicable: true,
        });
        await fixtures.chantierTerritoireJalon({
          id: "CH-007",
          territoire_code: "DEPT-75",
          maille: "DEPT",
          code_insee: "75",
          zone_id: "zone-1",
          jalon: 2025,
        });

        // when
        const result = await query.run({
          chantierIds: ["CH-006", "CH-007"],
          jalon: 2025,
        });

        // then
        expect(result).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              territoireCode: "DEPT-75",
              estApplicable: null,
            }),
          ]),
        );
      }),
    );
  });
});
