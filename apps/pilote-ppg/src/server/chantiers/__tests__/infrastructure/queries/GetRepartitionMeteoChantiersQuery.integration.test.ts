import { createIntegrationTest } from "@/test/createIntegrationTest";
import { fixtures } from "@/test/fixtures";
import { PrismaPilote } from "@/server/framework/persistence/PrismaPilote";
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
      const chantierEnSoleil = await fixtures.chantierIdentite({
        ministeres: ["MIN-01"],
      });
      const autreChantierEnSoleil = await fixtures.chantierIdentite({
        ministeres: ["MIN-01"],
      });
      const chantierEnOrage = await fixtures.chantierIdentite({
        ministeres: ["MIN-01"],
      });
      await fixtures.chantierTerritoire({
        id: chantierEnSoleil.id,
        territoire_code: "NAT-FR",
        code_insee: "FR",
        maille: "NAT",
        zone_id: "zone-1",
        meteo: "SOLEIL",
        est_applicable: true,
      });
      await fixtures.chantierTerritoire({
        id: autreChantierEnSoleil.id,
        territoire_code: "NAT-FR",
        code_insee: "FR",
        maille: "NAT",
        zone_id: "zone-1",
        meteo: "SOLEIL",
        est_applicable: true,
      });
      await fixtures.chantierTerritoire({
        id: chantierEnOrage.id,
        territoire_code: "NAT-FR",
        code_insee: "FR",
        maille: "NAT",
        zone_id: "zone-1",
        meteo: "ORAGE",
        est_applicable: true,
      });

      // When
      const result = await query.execute({
        chantierIds: [
          chantierEnSoleil.id,
          autreChantierEnSoleil.id,
          chantierEnOrage.id,
        ],
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
      const chantierApplicable = await fixtures.chantierIdentite({
        ministeres: ["MIN-01"],
      });
      const chantierNonApplicable = await fixtures.chantierIdentite({
        ministeres: ["MIN-01"],
      });
      await fixtures.chantierTerritoire({
        id: chantierApplicable.id,
        territoire_code: "NAT-FR",
        code_insee: "FR",
        maille: "NAT",
        zone_id: "zone-1",
        meteo: "SOLEIL",
        est_applicable: true,
      });
      await fixtures.chantierTerritoire({
        id: chantierNonApplicable.id,
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
        chantierIds: [chantierApplicable.id, chantierNonApplicable.id],
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
      const chantierAvecMinistere = await fixtures.chantierIdentite({
        ministeres: ["MIN-01"],
      });
      const chantierSansMinistere = await fixtures.chantierIdentite({
        // pas de ministères
        ministeres: [],
      });
      await fixtures.chantierTerritoire({
        id: chantierAvecMinistere.id,
        territoire_code: "NAT-FR",
        code_insee: "FR",
        maille: "NAT",
        zone_id: "zone-1",
        meteo: "COUVERT",
        est_applicable: true,
      });
      await fixtures.chantierTerritoire({
        id: chantierSansMinistere.id,
        territoire_code: "NAT-FR",
        code_insee: "FR",
        maille: "NAT",
        zone_id: "zone-1",
        meteo: "ORAGE",
        est_applicable: true,
      });

      // When
      const result = await query.execute({
        chantierIds: [chantierAvecMinistere.id, chantierSansMinistere.id],
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
      const chantierDemande = await fixtures.chantierIdentite({
        ministeres: ["MIN-01"],
      });
      const chantierNonDemande = await fixtures.chantierIdentite({
        ministeres: ["MIN-01"],
      });
      await fixtures.chantierTerritoire({
        id: chantierDemande.id,
        territoire_code: "NAT-FR",
        code_insee: "FR",
        maille: "NAT",
        zone_id: "zone-1",
        meteo: "SOLEIL",
        est_applicable: true,
      });
      await fixtures.chantierTerritoire({
        id: chantierNonDemande.id,
        territoire_code: "NAT-FR",
        code_insee: "FR",
        maille: "NAT",
        zone_id: "zone-1",
        meteo: "ORAGE",
        est_applicable: true,
      });

      // When — seul le premier chantier est demandé
      const result = await query.execute({
        chantierIds: [chantierDemande.id],
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
      const chantier = await fixtures.chantierIdentite({
        ministeres: ["MIN-01"],
      });
      await fixtures.chantierTerritoire({
        id: chantier.id,
        territoire_code: "NAT-FR",
        code_insee: "FR",
        maille: "NAT",
        zone_id: "zone-1",
        meteo: "SOLEIL",
        est_applicable: true,
      });
      await fixtures.chantierTerritoire({
        id: chantier.id,
        territoire_code: "DEPT-75",
        code_insee: "75",
        maille: "DEPT",
        zone_id: "zone-2",
        meteo: "ORAGE",
        est_applicable: true,
      });

      // When — on demande uniquement NAT-FR
      const result = await query.execute({
        chantierIds: [chantier.id],
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
