import { createIntegrationTest } from "@/server/infrastructure/test/createIntegrationTest";
import { fixtures } from "@/server/infrastructure/test/fixtures";
import { PrismaPilote } from "@/server/db/PrismaPilote";
import { GetChantiersEnRetardQuery } from "@/server/chantiers/query/GetChantiersEnRetardQuery";

describe("GetChantiersEnRetardQuery", () => {
  let query: GetChantiersEnRetardQuery;

  beforeEach(() => {
    query = new GetChantiersEnRetardQuery({
      prisma: new PrismaPilote(),
    });
  });

  it(
    "remonte un chantier dont l'écart sur le jalon demandé est <= -10",
    createIntegrationTest(async () => {
      // Given
      await fixtures.chantierIdentite({
        id: "CH-001",
        nom: "Chantier en retard",
        axe: "Axe 1",
        ppg: "PPG 1",
        ministeres_acronymes: ["MIN-01"],
        statut: "PUBLIE",
      });
      await fixtures.chantierTerritoire({
        id: "CH-001",
        territoire_code: "NAT-FR",
        code_insee: "FR",
        maille: "NAT",
        zone_id: "FRANCE",
        est_applicable: true,
      });
      await fixtures.chantierTerritoireJalon({
        id: "CH-001",
        territoire_code: "NAT-FR",
        code_insee: "FR",
        maille: "NAT",
        zone_id: "FRANCE",
        jalon: 2025,
        ecart: -15,
        taux_avancement: 30,
      });

      // When
      const result = await query.execute({
        territoireCode: "NAT-FR",
        jalon: 2025,
      });

      // Then
      expect(result.chantiers_en_retard).toEqual([
        {
          chantier: {
            id: "CH-001",
            nom: "Chantier en retard",
            axe: "Axe 1",
            ppg: "PPG 1",
            ministeres: ["MIN-01"],
          },
          ecart: -15,
          taux_avancement: 30,
          synthese: null,
        },
      ]);
    }),
  );

  it(
    "ne remonte pas un chantier dont seul l'écart mandat est <= -10 mais pas l'écart du jalon",
    createIntegrationTest(async () => {
      // Given — écart mandat agrégé en retard, mais écart sur le jalon courant rattrapé
      await fixtures.chantierIdentite({
        id: "CH-001",
        ministeres_acronymes: ["MIN-01"],
        statut: "PUBLIE",
      });
      await fixtures.chantierTerritoire({
        id: "CH-001",
        territoire_code: "NAT-FR",
        code_insee: "FR",
        maille: "NAT",
        zone_id: "FRANCE",
        est_applicable: true,
        ecart: -20,
      });
      await fixtures.chantierTerritoireJalon({
        id: "CH-001",
        territoire_code: "NAT-FR",
        code_insee: "FR",
        maille: "NAT",
        zone_id: "FRANCE",
        jalon: 2025,
        ecart: -5,
      });

      // When
      const result = await query.execute({
        territoireCode: "NAT-FR",
        jalon: 2025,
      });

      // Then
      expect(result.chantiers_en_retard).toEqual([]);
    }),
  );

  it(
    "remonte un chantier dont l'écart du jalon est <= -10 même si l'écart mandat ne l'est pas",
    createIntegrationTest(async () => {
      // Given — écart mandat OK, mais écart sur le jalon courant en retard
      await fixtures.chantierIdentite({
        id: "CH-001",
        nom: "Chantier",
        ministeres_acronymes: ["MIN-01"],
        statut: "PUBLIE",
      });
      await fixtures.chantierTerritoire({
        id: "CH-001",
        territoire_code: "NAT-FR",
        code_insee: "FR",
        maille: "NAT",
        zone_id: "FRANCE",
        est_applicable: true,
        ecart: -5,
      });
      await fixtures.chantierTerritoireJalon({
        id: "CH-001",
        territoire_code: "NAT-FR",
        code_insee: "FR",
        maille: "NAT",
        zone_id: "FRANCE",
        jalon: 2025,
        ecart: -15,
      });

      // When
      const result = await query.execute({
        territoireCode: "NAT-FR",
        jalon: 2025,
      });

      // Then — l'écart retourné est celui du jalon, pas du mandat
      expect(result.chantiers_en_retard).toEqual([
        expect.objectContaining({
          chantier: expect.objectContaining({ id: "CH-001" }),
          ecart: -15,
        }),
      ]);
    }),
  );

  it(
    "filtre par jalon — un même chantier peut être en retard sur un jalon et pas sur l'autre",
    createIntegrationTest(async () => {
      // Given — en retard en 2024, rattrapé en 2025
      await fixtures.chantierIdentite({
        id: "CH-001",
        ministeres_acronymes: ["MIN-01"],
        statut: "PUBLIE",
      });
      await fixtures.chantierTerritoire({
        id: "CH-001",
        territoire_code: "NAT-FR",
        code_insee: "FR",
        maille: "NAT",
        zone_id: "FRANCE",
        est_applicable: true,
      });
      await fixtures.chantierTerritoireJalon({
        id: "CH-001",
        territoire_code: "NAT-FR",
        code_insee: "FR",
        maille: "NAT",
        zone_id: "FRANCE",
        jalon: 2024,
        ecart: -20,
      });
      await fixtures.chantierTerritoireJalon({
        id: "CH-001",
        territoire_code: "NAT-FR",
        code_insee: "FR",
        maille: "NAT",
        zone_id: "FRANCE",
        jalon: 2025,
        ecart: -5,
      });

      // When — query sur jalon 2025
      const resultat2025 = await query.execute({
        territoireCode: "NAT-FR",
        jalon: 2025,
      });

      // Then
      expect(resultat2025.chantiers_en_retard).toEqual([]);

      // When — query sur jalon 2024
      const resultat2024 = await query.execute({
        territoireCode: "NAT-FR",
        jalon: 2024,
      });

      // Then
      expect(resultat2024.chantiers_en_retard).toEqual([
        expect.objectContaining({
          chantier: expect.objectContaining({ id: "CH-001" }),
          ecart: -20,
        }),
      ]);
    }),
  );

  it(
    "exclut les chantiers non applicables",
    createIntegrationTest(async () => {
      // Given
      await fixtures.chantierIdentite({
        id: "CH-001",
        ministeres_acronymes: ["MIN-01"],
        statut: "PUBLIE",
      });
      await fixtures.chantierTerritoire({
        id: "CH-001",
        territoire_code: "NAT-FR",
        code_insee: "FR",
        maille: "NAT",
        zone_id: "FRANCE",
        est_applicable: false,
      });
      await fixtures.chantierTerritoireJalon({
        id: "CH-001",
        territoire_code: "NAT-FR",
        code_insee: "FR",
        maille: "NAT",
        zone_id: "FRANCE",
        jalon: 2025,
        ecart: -15,
      });

      // When
      const result = await query.execute({
        territoireCode: "NAT-FR",
        jalon: 2025,
      });

      // Then
      expect(result.chantiers_en_retard).toEqual([]);
    }),
  );

  it(
    "exclut les chantiers non publiés",
    createIntegrationTest(async () => {
      // Given
      await fixtures.chantierIdentite({
        id: "CH-001",
        ministeres_acronymes: ["MIN-01"],
        statut: "BROUILLON",
      });
      await fixtures.chantierTerritoire({
        id: "CH-001",
        territoire_code: "NAT-FR",
        code_insee: "FR",
        maille: "NAT",
        zone_id: "FRANCE",
        est_applicable: true,
      });
      await fixtures.chantierTerritoireJalon({
        id: "CH-001",
        territoire_code: "NAT-FR",
        code_insee: "FR",
        maille: "NAT",
        zone_id: "FRANCE",
        jalon: 2025,
        ecart: -15,
      });

      // When
      const result = await query.execute({
        territoireCode: "NAT-FR",
        jalon: 2025,
      });

      // Then
      expect(result.chantiers_en_retard).toEqual([]);
    }),
  );

  it(
    "ne remonte que les chantiers du territoire demandé",
    createIntegrationTest(async () => {
      // Given
      await fixtures.chantierIdentite({
        id: "CH-001",
        ministeres_acronymes: ["MIN-01"],
        statut: "PUBLIE",
      });
      await fixtures.chantierTerritoire({
        id: "CH-001",
        territoire_code: "NAT-FR",
        code_insee: "FR",
        maille: "NAT",
        zone_id: "FRANCE",
        est_applicable: true,
      });
      await fixtures.chantierTerritoireJalon({
        id: "CH-001",
        territoire_code: "NAT-FR",
        code_insee: "FR",
        maille: "NAT",
        zone_id: "FRANCE",
        jalon: 2025,
        ecart: -15,
      });
      await fixtures.chantierTerritoire({
        id: "CH-001",
        territoire_code: "DEPT-75",
        code_insee: "75",
        maille: "DEPT",
        zone_id: "zone-2",
        est_applicable: true,
      });
      await fixtures.chantierTerritoireJalon({
        id: "CH-001",
        territoire_code: "DEPT-75",
        code_insee: "75",
        maille: "DEPT",
        zone_id: "zone-2",
        jalon: 2025,
        ecart: -25,
      });

      // When — on demande uniquement DEPT-75
      const result = await query.execute({
        territoireCode: "DEPT-75",
        jalon: 2025,
      });

      // Then
      expect(result.chantiers_en_retard).toEqual([
        expect.objectContaining({ ecart: -25 }),
      ]);
    }),
  );

  it(
    "trie les chantiers par écart croissant",
    createIntegrationTest(async () => {
      // Given
      await fixtures.chantierIdentite({
        id: "CH-001",
        ministeres_acronymes: ["MIN-01"],
        statut: "PUBLIE",
      });
      await fixtures.chantierTerritoire({
        id: "CH-001",
        territoire_code: "NAT-FR",
        code_insee: "FR",
        maille: "NAT",
        zone_id: "FRANCE",
        est_applicable: true,
      });
      await fixtures.chantierTerritoireJalon({
        id: "CH-001",
        territoire_code: "NAT-FR",
        code_insee: "FR",
        maille: "NAT",
        zone_id: "FRANCE",
        jalon: 2025,
        ecart: -12,
      });
      await fixtures.chantierIdentite({
        id: "CH-002",
        ministeres_acronymes: ["MIN-01"],
        statut: "PUBLIE",
      });
      await fixtures.chantierTerritoire({
        id: "CH-002",
        territoire_code: "NAT-FR",
        code_insee: "FR",
        maille: "NAT",
        zone_id: "FRANCE",
        est_applicable: true,
      });
      await fixtures.chantierTerritoireJalon({
        id: "CH-002",
        territoire_code: "NAT-FR",
        code_insee: "FR",
        maille: "NAT",
        zone_id: "FRANCE",
        jalon: 2025,
        ecart: -30,
      });
      await fixtures.chantierIdentite({
        id: "CH-003",
        ministeres_acronymes: ["MIN-01"],
        statut: "PUBLIE",
      });
      await fixtures.chantierTerritoire({
        id: "CH-003",
        territoire_code: "NAT-FR",
        code_insee: "FR",
        maille: "NAT",
        zone_id: "FRANCE",
        est_applicable: true,
      });
      await fixtures.chantierTerritoireJalon({
        id: "CH-003",
        territoire_code: "NAT-FR",
        code_insee: "FR",
        maille: "NAT",
        zone_id: "FRANCE",
        jalon: 2025,
        ecart: -20,
      });

      // When
      const result = await query.execute({
        territoireCode: "NAT-FR",
        jalon: 2025,
      });

      // Then — tri du plus bas écart au plus haut
      expect(result.chantiers_en_retard.map((c) => c.chantier.id)).toEqual([
        "CH-002",
        "CH-003",
        "CH-001",
      ]);
    }),
  );

  it(
    "retourne la dernière synthèse des résultats du chantier territoire",
    createIntegrationTest(async () => {
      // Given
      await fixtures.chantierIdentite({
        id: "CH-001",
        ministeres_acronymes: ["MIN-01"],
        statut: "PUBLIE",
      });
      await fixtures.chantierTerritoire({
        id: "CH-001",
        territoire_code: "NAT-FR",
        code_insee: "FR",
        maille: "NAT",
        zone_id: "FRANCE",
        est_applicable: true,
      });
      await fixtures.chantierTerritoireJalon({
        id: "CH-001",
        territoire_code: "NAT-FR",
        code_insee: "FR",
        maille: "NAT",
        zone_id: "FRANCE",
        jalon: 2025,
        ecart: -15,
      });
      await fixtures.syntheseDesResultats({
        chantier_id: "CH-001",
        territoire_code: "NAT-FR",
        maille: "NAT",
        code_insee: "FR",
        meteo: "ORAGE",
        commentaire: "Synthèse récente",
        date_modification: new Date("2025-06-01T00:00:00Z"),
      });
      await fixtures.syntheseDesResultats({
        chantier_id: "CH-001",
        territoire_code: "NAT-FR",
        maille: "NAT",
        code_insee: "FR",
        meteo: "SOLEIL",
        commentaire: "Synthèse plus ancienne",
        date_modification: new Date("2025-01-01T00:00:00Z"),
      });

      // When
      const result = await query.execute({
        territoireCode: "NAT-FR",
        jalon: 2025,
      });

      // Then — la synthèse la plus récente est retournée
      expect(result.chantiers_en_retard).toEqual([
        expect.objectContaining({
          synthese: {
            meteo: "ORAGE",
            commentaire: "Synthèse récente",
            date_meteo: "2025-06-01T00:00:00.000Z",
            date_commentaire: "2025-06-01T00:00:00.000Z",
          },
        }),
      ]);
    }),
  );
});
