import { $Enums } from "@prisma/client";
import { PrismaPilote } from "@/server/db/PrismaPilote";
import { createIntegrationTest } from "@/server/infrastructure/test/createIntegrationTest";
import { fixtures } from "@/server/infrastructure/test/fixtures";
import { RecupererLesChantiersTerritorialisesQuery } from "@/server/habilitations-coordinateur/queries/RecupererLesChantiersTerritorialisesQuery";

describe("RecupererLesChantiersTerritorialisesQuery", () => {
  let query: RecupererLesChantiersTerritorialisesQuery;

  beforeEach(() => {
    query = new RecupererLesChantiersTerritorialisesQuery({
      prisma: new PrismaPilote(),
    });
  });

  describe("run", () => {
    it(
      "retourne uniquement les chantiers publiés et territorialisés avec leurs territoires applicables",
      createIntegrationTest(async () => {
        // given
        const chantierPublieTerritorialise = await fixtures.chantierIdentite({
          nom: "Chantier territorialisé",
          statut: $Enums.type_statut.PUBLIE,
          est_territorialise: true,
          ate: $Enums.type_ate.ate,
        });

        await fixtures.chantierTerritoire({
          id: chantierPublieTerritorialise.id,
          territoire_code: "REG-11",
          est_applicable: true,
        });

        await fixtures.chantierTerritoire({
          id: chantierPublieTerritorialise.id,
          territoire_code: "DEPT-75",
          est_applicable: true,
        });

        // territoire non applicable, doit être exclu
        await fixtures.chantierTerritoire({
          id: chantierPublieTerritorialise.id,
          territoire_code: "DEPT-92",
          est_applicable: false,
        });

        // chantier brouillon, doit être exclu
        await fixtures.chantierIdentite({
          statut: $Enums.type_statut.BROUILLON,
          est_territorialise: true,
        });

        // chantier non territorialisé, doit être exclu
        await fixtures.chantierIdentite({
          statut: $Enums.type_statut.PUBLIE,
          est_territorialise: false,
        });

        // when
        const result = await query.run();

        // then
        expect(result).toEqual([
          {
            id: chantierPublieTerritorialise.id,
            nom: "Chantier territorialisé",
            ate: $Enums.type_ate.ate,
            territoiresApplicables: expect.arrayContaining([
              "REG-11",
              "DEPT-75",
            ]),
          },
        ]);
        expect(result[0].territoiresApplicables).not.toContain("DEPT-92");
      }),
    );

    it(
      "retourne un tableau vide si aucun chantier ne correspond",
      createIntegrationTest(async () => {
        // when
        const result = await query.run();

        // then
        expect(result).toEqual([]);
      }),
    );
  });
});
