import { createIntegrationTest } from "@/test/createIntegrationTest";
import { fixtures } from "@/test/fixtures";
import { RecupererTauxAvancementsChantierTerritoiresQuery } from "@/server/chantiers/infrastructure/queries/RecupererTauxAvancementsChantierTerritoiresQuery";
import { AgregerAvancementsChantiersUseCase } from "@/server/chantiers/usecases/AgregerAvancementsChantiersUseCase";
import { PrismaPilote } from "@/server/framework/persistence/PrismaPilote";
import { ChantierSQLRepository } from "@/server/chantiers/infrastructure/sql/ChantierSQLRepository";

const prismaPilote = new PrismaPilote();
let query: RecupererTauxAvancementsChantierTerritoiresQuery;

beforeEach(() => {
  query = new RecupererTauxAvancementsChantierTerritoiresQuery({
    agregerAvancementsChantiersUseCase: new AgregerAvancementsChantiersUseCase({
      chantierRepository: new ChantierSQLRepository({ prisma: prismaPilote }),
    }),
  });
});

describe("RecupererAvancementsTerritoiresQuery", () => {
  describe("dateTauxAvancementAnnuel", () => {
    it(
      "prend la date la plus récente parmi plusieurs chantiers",
      createIntegrationTest(async () => {
        // given
        const chantier = await fixtures.chantierIdentite();
        await fixtures.chantierTerritoire({
          id: chantier.id,
          territoire_code: "DEPT-75",
          maille: "DEPT",
          code_insee: "75",
          zone_id: "zone-1",
          est_applicable: true,
        });
        await fixtures.chantierTerritoireJalon({
          id: chantier.id,
          territoire_code: "DEPT-75",
          maille: "DEPT",
          code_insee: "75",
          zone_id: "zone-1",
          jalon: 2025,
          date_taux_avancement: new Date("2024-01-15T00:00:00.000Z"),
        });

        const autreChantier = await fixtures.chantierIdentite();
        await fixtures.chantierTerritoire({
          id: autreChantier.id,
          territoire_code: "DEPT-75",
          maille: "DEPT",
          code_insee: "75",
          zone_id: "zone-1",
          est_applicable: true,
        });
        await fixtures.chantierTerritoireJalon({
          id: autreChantier.id,
          territoire_code: "DEPT-75",
          maille: "DEPT",
          code_insee: "75",
          zone_id: "zone-1",
          jalon: 2025,
          date_taux_avancement: new Date("2024-07-15T00:00:00.000Z"),
        });

        // when
        const result = await query.run({
          chantierIds: [chantier.id, autreChantier.id],
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
        const chantier = await fixtures.chantierIdentite();
        await fixtures.chantierTerritoire({
          id: chantier.id,
          territoire_code: "DEPT-75",
          maille: "DEPT",
          code_insee: "75",
          zone_id: "zone-1",
          est_applicable: true,
        });
        await fixtures.chantierTerritoireJalon({
          id: chantier.id,
          territoire_code: "DEPT-75",
          maille: "DEPT",
          code_insee: "75",
          zone_id: "zone-1",
          jalon: 2025,
          // pas de date_taux_avancement
        });

        // when
        const result = await query.run({
          chantierIds: [chantier.id],
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
        const chantier = await fixtures.chantierIdentite();
        await fixtures.chantierTerritoire({
          id: chantier.id,
          territoire_code: "DEPT-75",
          maille: "DEPT",
          code_insee: "75",
          zone_id: "zone-1",
          est_applicable: false,
        });
        await fixtures.chantierTerritoireJalon({
          id: chantier.id,
          territoire_code: "DEPT-75",
          maille: "DEPT",
          code_insee: "75",
          zone_id: "zone-1",
          jalon: 2025,
        });

        const autreChantier = await fixtures.chantierIdentite();
        await fixtures.chantierTerritoire({
          id: autreChantier.id,
          territoire_code: "DEPT-75",
          maille: "DEPT",
          code_insee: "75",
          zone_id: "zone-1",
          est_applicable: false,
        });
        await fixtures.chantierTerritoireJalon({
          id: autreChantier.id,
          territoire_code: "DEPT-75",
          maille: "DEPT",
          code_insee: "75",
          zone_id: "zone-1",
          jalon: 2025,
        });

        // when
        const result = await query.run({
          chantierIds: [chantier.id, autreChantier.id],
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
        const chantier = await fixtures.chantierIdentite();
        await fixtures.chantierTerritoire({
          id: chantier.id,
          territoire_code: "DEPT-75",
          maille: "DEPT",
          code_insee: "75",
          zone_id: "zone-1",
          est_applicable: true,
        });
        await fixtures.chantierTerritoireJalon({
          id: chantier.id,
          territoire_code: "DEPT-75",
          maille: "DEPT",
          code_insee: "75",
          zone_id: "zone-1",
          jalon: 2025,
        });

        const autreChantier = await fixtures.chantierIdentite();
        await fixtures.chantierTerritoire({
          id: autreChantier.id,
          territoire_code: "DEPT-75",
          maille: "DEPT",
          code_insee: "75",
          zone_id: "zone-1",
          est_applicable: true,
        });
        await fixtures.chantierTerritoireJalon({
          id: autreChantier.id,
          territoire_code: "DEPT-75",
          maille: "DEPT",
          code_insee: "75",
          zone_id: "zone-1",
          jalon: 2025,
        });

        // when
        const result = await query.run({
          chantierIds: [chantier.id, autreChantier.id],
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
        const chantierNonApplicable = await fixtures.chantierIdentite();
        await fixtures.chantierTerritoire({
          id: chantierNonApplicable.id,
          territoire_code: "DEPT-75",
          maille: "DEPT",
          code_insee: "75",
          zone_id: "zone-1",
          est_applicable: false,
        });
        await fixtures.chantierTerritoireJalon({
          id: chantierNonApplicable.id,
          territoire_code: "DEPT-75",
          maille: "DEPT",
          code_insee: "75",
          zone_id: "zone-1",
          jalon: 2025,
        });

        const chantierApplicable = await fixtures.chantierIdentite();
        await fixtures.chantierTerritoire({
          id: chantierApplicable.id,
          territoire_code: "DEPT-75",
          maille: "DEPT",
          code_insee: "75",
          zone_id: "zone-1",
          est_applicable: true,
        });
        await fixtures.chantierTerritoireJalon({
          id: chantierApplicable.id,
          territoire_code: "DEPT-75",
          maille: "DEPT",
          code_insee: "75",
          zone_id: "zone-1",
          jalon: 2025,
        });

        // when
        const result = await query.run({
          chantierIds: [chantierNonApplicable.id, chantierApplicable.id],
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
