import { createIntegrationTest } from "@/server/infrastructure/test/createIntegrationTest";
import { fixtures } from "@/server/infrastructure/test/fixtures";
import { PrismaPilote } from "@/server/db/PrismaPilote";
import { GetChantiersSignalesListQuery } from "@/server/chantiers/query/GetChantiersSignalesListQuery";
import { LIBELLE_ABSENCE_TAUX_DEPARTEMENTAL } from "@/server/chantiers/app/contrats/LibellesAlerteChantier";

describe("GetChantiersSignalesListQuery", () => {
  let query: GetChantiersSignalesListQuery;

  beforeEach(() => {
    query = new GetChantiersSignalesListQuery({ prisma: new PrismaPilote() });
  });

  it(
    "regroupe plusieurs catégories pour un même chantier sans le dupliquer",
    createIntegrationTest(async () => {
      // Given — un chantier départemental avec météo non renseignée ET tendance en baisse
      await fixtures.chantierIdentite({
        id: "CH-001",
        nom: "Chantier multi-signalé",
        axe: "Axe 1",
        ppg: "PPG 1",
        ministeres: ["Ministère 01"],
        ministeres_acronymes: ["MIN-01"],
      });
      await fixtures.chantierTerritoire({
        id: "CH-001",
        territoire_code: "DEPT-75",
        code_insee: "75",
        maille: "DEPT",
        zone_id: "zone-1",
        est_applicable: true,
        meteo: "NON_RENSEIGNEE",
        tendance: "BAISSE",
      });
      await fixtures.chantierTerritoireJalon({
        id: "CH-001",
        territoire_code: "DEPT-75",
        code_insee: "75",
        maille: "DEPT",
        zone_id: "zone-1",
        jalon: 2025,
        ecart: 0,
      });

      // When
      const result = await query.execute({
        territoireCode: "DEPT-75",
        jalon: 2025,
      });

      // Then
      expect(result.chantiers).toEqual([
        {
          chantier: {
            id: "CH-001",
            nom: "Chantier multi-signalé",
            axe: "Axe 1",
            ppg: "PPG 1",
            ministeres: ["MIN-01"],
          },
          categories_signalement: [
            "Chantier(s) avec météo et synthèse des résultats non renseignés",
            "Chantier(s) avec tendance en baisse",
          ],
          meteo: "NON_RENSEIGNEE",
          tendance: "BAISSE",
          ecart: 0,
          taux_avancement: null,
        },
      ]);
    }),
  );

  it(
    "n'inclut pas un chantier sans aucune catégorie applicable",
    createIntegrationTest(async () => {
      // Given — chantier sans anomalie
      await fixtures.chantierIdentite({
        id: "CH-001",
        ministeres: ["Ministère 01"],
        ministeres_acronymes: ["MIN-01"],
      });
      await fixtures.chantierTerritoire({
        id: "CH-001",
        territoire_code: "DEPT-75",
        code_insee: "75",
        maille: "DEPT",
        zone_id: "zone-1",
        est_applicable: true,
        meteo: "SOLEIL",
        tendance: "HAUSSE",
      });
      await fixtures.chantierTerritoireJalon({
        id: "CH-001",
        territoire_code: "DEPT-75",
        code_insee: "75",
        maille: "DEPT",
        zone_id: "zone-1",
        jalon: 2025,
        ecart: 0,
        taux_avancement: 50,
      });

      // When
      const result = await query.execute({
        territoireCode: "DEPT-75",
        jalon: 2025,
      });

      // Then
      expect(result.chantiers).toEqual([]);
    }),
  );

  it(
    "n'inclut pas un chantier en difficulté (météo dégradée) au seul motif de sa météo",
    createIntegrationTest(async () => {
      // Given — météo ORAGE (donc "en difficulté"), mais aucune catégorie de signalement
      await fixtures.chantierIdentite({
        id: "CH-001",
        ministeres: ["Ministère 01"],
        ministeres_acronymes: ["MIN-01"],
      });
      await fixtures.chantierTerritoire({
        id: "CH-001",
        territoire_code: "DEPT-75",
        code_insee: "75",
        maille: "DEPT",
        zone_id: "zone-1",
        est_applicable: true,
        meteo: "ORAGE",
        tendance: "HAUSSE",
      });
      await fixtures.chantierTerritoireJalon({
        id: "CH-001",
        territoire_code: "DEPT-75",
        code_insee: "75",
        maille: "DEPT",
        zone_id: "zone-1",
        jalon: 2025,
        ecart: 0,
        taux_avancement: 50,
      });

      // When
      const result = await query.execute({
        territoireCode: "DEPT-75",
        jalon: 2025,
      });

      // Then — la météo ORAGE seule ne suffit pas à signaler ce chantier
      expect(result.chantiers).toEqual([]);
    }),
  );

  it(
    "filtre sur une catégorie précise avec categorieSignalement",
    createIntegrationTest(async () => {
      // Given — CH-001 en retard, CH-002 avec PVA
      await fixtures.chantierIdentite({
        id: "CH-001",
        ministeres: ["Ministère 01"],
        ministeres_acronymes: ["MIN-01"],
      });
      await fixtures.chantierTerritoire({
        id: "CH-001",
        territoire_code: "DEPT-75",
        code_insee: "75",
        maille: "DEPT",
        zone_id: "zone-1",
        est_applicable: true,
        meteo: "SOLEIL",
      });
      await fixtures.chantierTerritoireJalon({
        id: "CH-001",
        territoire_code: "DEPT-75",
        code_insee: "75",
        maille: "DEPT",
        zone_id: "zone-1",
        jalon: 2025,
        ecart: -15,
      });
      await fixtures.chantierIdentite({
        id: "CH-002",
        ministeres: ["Ministère 01"],
        ministeres_acronymes: ["MIN-01"],
      });
      await fixtures.chantierTerritoire({
        id: "CH-002",
        territoire_code: "DEPT-75",
        code_insee: "75",
        maille: "DEPT",
        zone_id: "zone-1",
        est_applicable: true,
        meteo: "SOLEIL",
        nombre_propositions_valeur_actuelle: 1,
      });
      await fixtures.chantierTerritoireJalon({
        id: "CH-002",
        territoire_code: "DEPT-75",
        code_insee: "75",
        maille: "DEPT",
        zone_id: "zone-1",
        jalon: 2025,
        ecart: 0,
      });

      // When — on ne demande que la PVA
      const result = await query.execute({
        territoireCode: "DEPT-75",
        jalon: 2025,
        categorieSignalement: "proposition_valeur_avancement",
      });

      // Then — seul CH-002 est retourné, avec uniquement cette catégorie
      expect(result.chantiers).toEqual([
        expect.objectContaining({
          chantier: expect.objectContaining({ id: "CH-002" }),
          categories_signalement: [
            "Chantier(s) avec proposition(s) de valeur d'avancement",
          ],
        }),
      ]);
    }),
  );

  it(
    "propage la PVA depuis les territoires enfants au national",
    createIntegrationTest(async () => {
      // Given — PVA = 0 au NAT, mais > 0 sur un DEPT enfant
      // (cible_attendue: false pour ne pas déclencher la catégorie
      // "absence de taux départemental", hors périmètre de ce test)
      await fixtures.chantierIdentite({
        id: "CH-001",
        ministeres: ["Ministère 01"],
        ministeres_acronymes: ["MIN-01"],
        cible_attendue: false,
      });
      await fixtures.chantierTerritoire({
        id: "CH-001",
        territoire_code: "NAT-FR",
        code_insee: "FR",
        maille: "NAT",
        zone_id: "zone-1",
        est_applicable: true,
        meteo: "SOLEIL",
        nombre_propositions_valeur_actuelle: 0,
      });
      await fixtures.chantierTerritoireJalon({
        id: "CH-001",
        territoire_code: "NAT-FR",
        code_insee: "FR",
        maille: "NAT",
        zone_id: "zone-1",
        jalon: 2025,
        taux_avancement: 50,
      });
      await fixtures.chantierTerritoire({
        id: "CH-001",
        territoire_code: "DEPT-75",
        code_insee: "75",
        maille: "DEPT",
        zone_id: "zone-2",
        est_applicable: true,
        meteo: "SOLEIL",
        nombre_propositions_valeur_actuelle: 3,
      });

      // When
      const result = await query.execute({
        territoireCode: "NAT-FR",
        jalon: 2025,
      });

      // Then
      expect(result.chantiers).toEqual([
        expect.objectContaining({
          chantier: expect.objectContaining({ id: "CH-001" }),
          categories_signalement: [
            "Chantier(s) avec proposition(s) de valeur d'avancement",
          ],
        }),
      ]);
    }),
  );

  it(
    "détecte l'absence de taux d'avancement départemental au national",
    createIntegrationTest(async () => {
      // Given — cible_attendue, DEPT applicable mais taux_avancement null
      await fixtures.chantierIdentite({
        id: "CH-001",
        ministeres: ["Ministère 01"],
        ministeres_acronymes: ["MIN-01"],
        cible_attendue: true,
      });
      await fixtures.chantierTerritoire({
        id: "CH-001",
        territoire_code: "NAT-FR",
        code_insee: "FR",
        maille: "NAT",
        zone_id: "zone-1",
        est_applicable: true,
        meteo: "SOLEIL",
      });
      await fixtures.chantierTerritoireJalon({
        id: "CH-001",
        territoire_code: "NAT-FR",
        code_insee: "FR",
        maille: "NAT",
        zone_id: "zone-1",
        jalon: 2025,
        taux_avancement: 50,
      });
      await fixtures.chantierTerritoire({
        id: "CH-001",
        territoire_code: "DEPT-75",
        code_insee: "75",
        maille: "DEPT",
        zone_id: "zone-2",
        est_applicable: true,
        meteo: "SOLEIL",
      });
      await fixtures.chantierTerritoireJalon({
        id: "CH-001",
        territoire_code: "DEPT-75",
        code_insee: "75",
        maille: "DEPT",
        zone_id: "zone-2",
        jalon: 2025,
        taux_avancement: null,
      });

      // When
      const result = await query.execute({
        territoireCode: "NAT-FR",
        jalon: 2025,
      });

      // Then
      expect(result.chantiers).toEqual([
        expect.objectContaining({
          chantier: expect.objectContaining({ id: "CH-001" }),
          categories_signalement: [LIBELLE_ABSENCE_TAUX_DEPARTEMENTAL],
        }),
      ]);
    }),
  );

  it(
    "exclut les chantiers d'un autre territoire",
    createIntegrationTest(async () => {
      // Given
      await fixtures.chantierIdentite({
        id: "CH-001",
        ministeres: ["Ministère 01"],
        ministeres_acronymes: ["MIN-01"],
      });
      await fixtures.chantierTerritoire({
        id: "CH-001",
        territoire_code: "DEPT-75",
        code_insee: "75",
        maille: "DEPT",
        zone_id: "zone-1",
        est_applicable: true,
        tendance: "BAISSE",
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
        territoire_code: "DEPT-76",
        code_insee: "76",
        maille: "DEPT",
        zone_id: "zone-2",
        est_applicable: true,
        meteo: "SOLEIL",
        tendance: "HAUSSE",
      });

      // When — on interroge DEPT-76 uniquement
      const result = await query.execute({
        territoireCode: "DEPT-76",
        jalon: 2025,
      });

      // Then
      expect(result.chantiers).toEqual([]);
    }),
  );

  it(
    "exclut les chantiers sans ministère, même applicables",
    createIntegrationTest(async () => {
      // Given
      await fixtures.chantierIdentite({
        id: "CH-001",
        ministeres_acronymes: [],
      });
      await fixtures.chantierTerritoire({
        id: "CH-001",
        territoire_code: "DEPT-75",
        code_insee: "75",
        maille: "DEPT",
        zone_id: "zone-1",
        est_applicable: true,
        tendance: "BAISSE",
      });

      // When
      const result = await query.execute({
        territoireCode: "DEPT-75",
        jalon: 2025,
      });

      // Then
      expect(result.chantiers).toEqual([]);
    }),
  );
});
