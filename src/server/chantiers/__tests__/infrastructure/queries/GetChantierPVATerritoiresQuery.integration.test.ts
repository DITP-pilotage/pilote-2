import { createIntegrationTest } from "@/server/infrastructure/test/createIntegrationTest";
import { fixtures } from "@/server/infrastructure/test/fixtures";
import { PrismaPilote } from "@/server/db/PrismaPilote";
import { GetChantierPVATerritoiresQuery } from "@/server/chantiers/infrastructure/queries/GetChantierPVATerritoiresQuery";

describe("GetChantierPVATerritoiresQuery", () => {
  let query: GetChantierPVATerritoiresQuery;

  beforeEach(() => {
    query = new GetChantierPVATerritoiresQuery({
      prisma: new PrismaPilote(),
    });
  });

  it(
    "retourne les PVA pour les territoires NAT, REG et DEPT",
    createIntegrationTest(async () => {
      // Given
      await fixtures.chantierIdentite({ id: "CH-001" });
      await fixtures.chantierTerritoire({
        id: "CH-001",
        territoire_code: "DEPT-75",
        code_insee: "75",
        maille: "DEPT",
        zone_id: "zone-1",
        est_applicable: true,
        nombre_propositions_valeur_actuelle: 3,
      });
      await fixtures.chantierTerritoireJalon({
        id: "CH-001",
        territoire_code: "DEPT-75",
        code_insee: "75",
        maille: "DEPT",
        zone_id: "zone-1",
        jalon: 2025,
      });
      await fixtures.chantierTerritoire({
        id: "CH-001",
        territoire_code: "REG-11",
        code_insee: "11",
        maille: "REG",
        zone_id: "zone-2",
        est_applicable: true,
        nombre_propositions_valeur_actuelle: 0,
      });
      await fixtures.chantierTerritoireJalon({
        id: "CH-001",
        territoire_code: "REG-11",
        code_insee: "11",
        maille: "REG",
        zone_id: "zone-2",
        jalon: 2025,
      });
      await fixtures.chantierTerritoire({
        id: "CH-001",
        territoire_code: "NAT-FR",
        code_insee: "FR",
        maille: "NAT",
        zone_id: "zone-3",
        est_applicable: true,
        nombre_propositions_valeur_actuelle: 1,
      });
      await fixtures.chantierTerritoireJalon({
        id: "CH-001",
        territoire_code: "NAT-FR",
        code_insee: "FR",
        maille: "NAT",
        zone_id: "zone-3",
        jalon: 2025,
      });

      // When
      const result = await query.execute({
        chantierId: "CH-001",
        jalon: 2025,
      });

      // Then
      expect(result).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            territoireCode: "DEPT-75",
            codeInsee: "75",
            nombrePropositionsValeur: 3,
          }),
          expect.objectContaining({
            territoireCode: "REG-11",
            codeInsee: "11",
            nombrePropositionsValeur: 0,
          }),
          expect.objectContaining({
            territoireCode: "NAT-FR",
            codeInsee: "FR",
            nombrePropositionsValeur: 1,
          }),
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
        est_applicable: true,
        nombre_propositions_valeur_actuelle: 2,
      });
      await fixtures.chantierTerritoireJalon({
        id: "CH-002",
        territoire_code: "DEPT-75",
        code_insee: "75",
        maille: "DEPT",
        zone_id: "zone-1",
        jalon: 2025,
      });
      await fixtures.chantierTerritoire({
        id: "CH-002",
        territoire_code: "DEPT-13",
        code_insee: "13",
        maille: "DEPT",
        zone_id: "zone-2",
        est_applicable: false,
        nombre_propositions_valeur_actuelle: 0,
      });
      await fixtures.chantierTerritoireJalon({
        id: "CH-002",
        territoire_code: "DEPT-13",
        code_insee: "13",
        maille: "DEPT",
        zone_id: "zone-2",
        jalon: 2025,
      });

      // When
      const result = await query.execute({
        chantierId: "CH-002",
        jalon: 2025,
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
    "retourne le nombre de propositions valeur à 0 par défaut",
    createIntegrationTest(async () => {
      // Given
      await fixtures.chantierIdentite({ id: "CH-003" });
      await fixtures.chantierTerritoire({
        id: "CH-003",
        territoire_code: "DEPT-75",
        code_insee: "75",
        maille: "DEPT",
        zone_id: "zone-1",
        est_applicable: true,
      });
      await fixtures.chantierTerritoireJalon({
        id: "CH-003",
        territoire_code: "DEPT-75",
        code_insee: "75",
        maille: "DEPT",
        zone_id: "zone-1",
        jalon: 2025,
      });

      // When
      const result = await query.execute({
        chantierId: "CH-003",
        jalon: 2025,
      });

      // Then
      expect(result).toEqual([
        expect.objectContaining({
          territoireCode: "DEPT-75",
          nombrePropositionsValeur: 0,
        }),
      ]);
    }),
  );

  it(
    "retourne une liste vide quand aucun territoire ne correspond",
    createIntegrationTest(async () => {
      // Given
      await fixtures.chantierIdentite({ id: "CH-004" });

      // When
      const result = await query.execute({
        chantierId: "CH-004",
        jalon: 2025,
      });

      // Then
      expect(result).toEqual([]);
    }),
  );
});
