import { createIntegrationTest } from "@/server/infrastructure/test/createIntegrationTest";
import { fixtures } from "@/server/infrastructure/test/fixtures";
import { PrismaPilote } from "@/server/db/PrismaPilote";
import { GetRepartitionMeteoChantiersQuery } from "@/server/chantiers/infrastructure/queries/GetRepartitionMeteoChantiersQuery";

describe("GetRepartitionMeteoChantiersQuery", () => {
  let query: GetRepartitionMeteoChantiersQuery;

  beforeEach(() => {
    query = new GetRepartitionMeteoChantiersQuery({
      prisma: new PrismaPilote(),
    });
  });

  it(
    "retourne la répartition des météos pour les chantiers donnés sur un territoire",
    createIntegrationTest(async () => {
      // Given
      await fixtures.chantierIdentite({
        id: "CH-001",
        ministeres: ["MIN-01"],
      });
      await fixtures.chantierIdentite({
        id: "CH-002",
        ministeres: ["MIN-01"],
      });
      await fixtures.chantierIdentite({
        id: "CH-003",
        ministeres: ["MIN-01"],
      });
      await fixtures.chantierTerritoire({
        id: "CH-001",
        territoire_code: "NAT-FR",
        code_insee: "FR",
        maille: "NAT",
        zone_id: "zone-1",
        meteo: "SOLEIL",
        est_applicable: true,
      });
      await fixtures.chantierTerritoire({
        id: "CH-002",
        territoire_code: "NAT-FR",
        code_insee: "FR",
        maille: "NAT",
        zone_id: "zone-1",
        meteo: "SOLEIL",
        est_applicable: true,
      });
      await fixtures.chantierTerritoire({
        id: "CH-003",
        territoire_code: "NAT-FR",
        code_insee: "FR",
        maille: "NAT",
        zone_id: "zone-1",
        meteo: "ORAGE",
        est_applicable: true,
      });

      // When
      const result = await query.execute({
        chantierIds: ["CH-001", "CH-002", "CH-003"],
        territoireCode: "NAT-FR",
      });

      // Then
      expect(result).toEqual({
        COUVERT: 0,
        NUAGE: 0,
        ORAGE: 1,
        SOLEIL: 2,
      });
    }),
  );

  it(
    "exclut les chantiers non applicables",
    createIntegrationTest(async () => {
      // Given
      await fixtures.chantierIdentite({
        id: "CH-001",
        ministeres: ["MIN-01"],
      });
      await fixtures.chantierIdentite({
        id: "CH-002",
        ministeres: ["MIN-01"],
      });
      await fixtures.chantierTerritoire({
        id: "CH-001",
        territoire_code: "NAT-FR",
        code_insee: "FR",
        maille: "NAT",
        zone_id: "zone-1",
        meteo: "SOLEIL",
        est_applicable: true,
      });
      await fixtures.chantierTerritoire({
        id: "CH-002",
        territoire_code: "NAT-FR",
        code_insee: "FR",
        maille: "NAT",
        zone_id: "zone-1",
        meteo: "NUAGE",
        // chantier non applicable
        est_applicable: false,
      });

      // When
      const result = await query.execute({
        chantierIds: ["CH-001", "CH-002"],
        territoireCode: "NAT-FR",
      });

      // Then
      expect(result).toEqual({
        COUVERT: 0,
        NUAGE: 0,
        ORAGE: 0,
        SOLEIL: 1,
      });
    }),
  );

  it(
    "exclut les chantiers sans ministères",
    createIntegrationTest(async () => {
      // Given
      await fixtures.chantierIdentite({
        id: "CH-001",
        ministeres: ["MIN-01"],
      });
      await fixtures.chantierIdentite({
        id: "CH-002",
        // pas de ministères
        ministeres: [],
      });
      await fixtures.chantierTerritoire({
        id: "CH-001",
        territoire_code: "NAT-FR",
        code_insee: "FR",
        maille: "NAT",
        zone_id: "zone-1",
        meteo: "COUVERT",
        est_applicable: true,
      });
      await fixtures.chantierTerritoire({
        id: "CH-002",
        territoire_code: "NAT-FR",
        code_insee: "FR",
        maille: "NAT",
        zone_id: "zone-1",
        meteo: "ORAGE",
        est_applicable: true,
      });

      // When
      const result = await query.execute({
        chantierIds: ["CH-001", "CH-002"],
        territoireCode: "NAT-FR",
      });

      // Then
      expect(result).toEqual({
        COUVERT: 1,
        NUAGE: 0,
        ORAGE: 0,
        SOLEIL: 0,
      });
    }),
  );

  it(
    "ignore les chantiers dont l'id n'est pas dans la liste",
    createIntegrationTest(async () => {
      // Given
      await fixtures.chantierIdentite({
        id: "CH-001",
        ministeres: ["MIN-01"],
      });
      await fixtures.chantierIdentite({
        id: "CH-002",
        ministeres: ["MIN-01"],
      });
      await fixtures.chantierTerritoire({
        id: "CH-001",
        territoire_code: "NAT-FR",
        code_insee: "FR",
        maille: "NAT",
        zone_id: "zone-1",
        meteo: "SOLEIL",
        est_applicable: true,
      });
      await fixtures.chantierTerritoire({
        id: "CH-002",
        territoire_code: "NAT-FR",
        code_insee: "FR",
        maille: "NAT",
        zone_id: "zone-1",
        meteo: "ORAGE",
        est_applicable: true,
      });

      // When — seul CH-001 est demandé
      const result = await query.execute({
        chantierIds: ["CH-001"],
        territoireCode: "NAT-FR",
      });

      // Then
      expect(result).toEqual({
        COUVERT: 0,
        NUAGE: 0,
        ORAGE: 0,
        SOLEIL: 1,
      });
    }),
  );

  it(
    "retourne tous les compteurs à zéro quand aucun chantier ne correspond",
    createIntegrationTest(async () => {
      // When
      const result = await query.execute({
        chantierIds: ["CH-INEXISTANT"],
        territoireCode: "NAT-FR",
      });

      // Then
      expect(result).toEqual({
        COUVERT: 0,
        NUAGE: 0,
        ORAGE: 0,
        SOLEIL: 0,
      });
    }),
  );

  it(
    "ne compte que les chantiers du territoire demandé",
    createIntegrationTest(async () => {
      // Given
      await fixtures.chantierIdentite({
        id: "CH-001",
        ministeres: ["MIN-01"],
      });
      await fixtures.chantierTerritoire({
        id: "CH-001",
        territoire_code: "NAT-FR",
        code_insee: "FR",
        maille: "NAT",
        zone_id: "zone-1",
        meteo: "SOLEIL",
        est_applicable: true,
      });
      await fixtures.chantierTerritoire({
        id: "CH-001",
        territoire_code: "DEPT-75",
        code_insee: "75",
        maille: "DEPT",
        zone_id: "zone-2",
        meteo: "ORAGE",
        est_applicable: true,
      });

      // When — on demande uniquement NAT-FR
      const result = await query.execute({
        chantierIds: ["CH-001"],
        territoireCode: "NAT-FR",
      });

      // Then — seule la météo NAT-FR est comptée
      expect(result).toEqual({
        COUVERT: 0,
        NUAGE: 0,
        ORAGE: 0,
        SOLEIL: 1,
      });
    }),
  );
});
