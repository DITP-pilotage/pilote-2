import { createIntegrationTest } from "@/server/infrastructure/test/createIntegrationTest";
import { fixtures } from "@/server/infrastructure/test/fixtures";
import { PrismaPilote } from "@/server/db/PrismaPilote";
import { GetChantierMeteosTerritoiresQuery } from "@/server/chantiers/infrastructure/queries/GetChantierMeteosTerritoiresQuery";

describe("GetChantierMeteosTerritoiresQuery", () => {
  let query: GetChantierMeteosTerritoiresQuery;

  beforeEach(() => {
    query = new GetChantierMeteosTerritoiresQuery({
      prisma: new PrismaPilote(),
    });
  });

  it(
    "retourne les météos REG et DEPT mais pas NAT",
    createIntegrationTest(async () => {
      // Given
      await fixtures.chantierIdentite({ id: "CH-001" });
      await fixtures.chantierTerritoire({
        id: "CH-001",
        territoire_code: "DEPT-75",
        code_insee: "75",
        maille: "DEPT",
        zone_id: "zone-1",
        meteo: "SOLEIL",
        est_applicable: true,
      });
      await fixtures.chantierTerritoire({
        id: "CH-001",
        territoire_code: "REG-11",
        code_insee: "11",
        maille: "REG",
        zone_id: "zone-2",
        meteo: "ORAGE",
        est_applicable: true,
      });
      await fixtures.chantierTerritoire({
        id: "CH-001",
        territoire_code: "NAT-FR",
        code_insee: "FR",
        maille: "NAT",
        zone_id: "zone-3",
        meteo: "NUAGE",
        est_applicable: true,
      });

      // When
      const result = await query.execute({
        chantierId: "CH-001",
      });

      // Then
      expect(result).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            territoireCode: "DEPT-75",
            codeInsee: "75",
            meteo: "SOLEIL",
          }),
          expect.objectContaining({
            territoireCode: "REG-11",
            codeInsee: "11",
            meteo: "ORAGE",
          }),
        ]),
      );
      expect(result).not.toEqual(
        expect.arrayContaining([
          expect.objectContaining({ territoireCode: "NAT-FR" }),
        ]),
      );
    }),
  );

  it(
    "retourne estApplicable correctement",
    createIntegrationTest(async () => {
      // Given
      await fixtures.chantierIdentite({ id: "CH-002" });
      await fixtures.chantierTerritoire({
        id: "CH-002",
        territoire_code: "DEPT-75",
        code_insee: "75",
        maille: "DEPT",
        zone_id: "zone-1",
        meteo: "SOLEIL",
        est_applicable: true,
      });
      await fixtures.chantierTerritoire({
        id: "CH-002",
        territoire_code: "DEPT-13",
        code_insee: "13",
        maille: "DEPT",
        zone_id: "zone-2",
        meteo: "ORAGE",
        est_applicable: false,
      });

      // When
      const result = await query.execute({
        chantierId: "CH-002",
      });

      // Then
      expect(result).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            territoireCode: "DEPT-75",
            estApplicable: true,
          }),
          expect.objectContaining({
            territoireCode: "DEPT-13",
            estApplicable: false,
          }),
        ]),
      );
    }),
  );

  it(
    "mappe territoire_nom et code_insee",
    createIntegrationTest(async () => {
      // Given
      await fixtures.chantierIdentite({ id: "CH-003" });
      await fixtures.chantierTerritoire({
        id: "CH-003",
        territoire_code: "REG-11",
        code_insee: "11",
        maille: "REG",
        zone_id: "zone-1",
        territoire_nom: "Île-de-France",
        meteo: "NUAGE",
        est_applicable: true,
      });

      // When
      const result = await query.execute({
        chantierId: "CH-003",
      });

      // Then
      expect(result).toEqual([
        expect.objectContaining({
          territoireCode: "REG-11",
          territoireNom: "Île-de-France",
          codeInsee: "11",
        }),
      ]);
    }),
  );

  it(
    "retourne NON_RENSEIGNEE quand meteo est null",
    createIntegrationTest(async () => {
      // Given
      await fixtures.chantierIdentite({ id: "CH-004" });
      await fixtures.chantierTerritoire({
        id: "CH-004",
        territoire_code: "DEPT-75",
        code_insee: "75",
        maille: "DEPT",
        zone_id: "zone-1",
        meteo: null,
        est_applicable: true,
      });

      // When
      const result = await query.execute({
        chantierId: "CH-004",
      });

      // Then
      expect(result).toEqual([
        expect.objectContaining({
          meteo: "NON_RENSEIGNEE",
        }),
      ]);
    }),
  );

  it(
    "retourne une liste vide quand aucun territoire ne correspond",
    createIntegrationTest(async () => {
      // Given
      await fixtures.chantierIdentite({ id: "CH-005" });

      // When
      const result = await query.execute({
        chantierId: "CH-005",
      });

      // Then
      expect(result).toEqual([]);
    }),
  );
});
