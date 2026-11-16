import { createIntegrationTest } from "@/test/createIntegrationTest";
import { fixtures } from "@/test/fixtures";
import { PrismaPilote } from "@/server/framework/persistence/PrismaPilote";
import { GetStatistiquesAvancementChantiersParChantierQuery } from "@/server/chantiers/infrastructure/queries/GetStatistiquesAvancementChantiersParChantierQuery";

describe("GetStatistiquesAvancementChantiersParChantierQuery", () => {
  let query: GetStatistiquesAvancementChantiersParChantierQuery;

  beforeEach(() => {
    query = new GetStatistiquesAvancementChantiersParChantierQuery({
      prisma: new PrismaPilote(),
    });
  });

  it(
    "quand le nombre de territoires par chantier est pair, doit récupérer les statistiques pour chaque chantier séparément",
    createIntegrationTest(async () => {
      // Given
      const premierChantier = await fixtures.chantierIdentite();
      const secondChantier = await fixtures.chantierIdentite();
      const chantierHorsListe = await fixtures.chantierIdentite();
      const listeChantierIds = [premierChantier.id, secondChantier.id];

      // premierChantier : DEPT-87 (taux 10) et DEPT-88 (taux 12)
      await fixtures.chantierTerritoire({
        id: premierChantier.id,
        territoire_code: "DEPT-87",
        maille: "DEPT",
        code_insee: "87",
        zone_id: "D87",
      });
      await fixtures.chantierTerritoire({
        id: premierChantier.id,
        territoire_code: "DEPT-88",
        maille: "DEPT",
        code_insee: "88",
        zone_id: "D88",
      });
      // secondChantier : DEPT-87 (taux 14), DEPT-88 (taux 16), REG-01 (taux 50 — ignoré car maille différente)
      await fixtures.chantierTerritoire({
        id: secondChantier.id,
        territoire_code: "DEPT-87",
        maille: "DEPT",
        code_insee: "87",
        zone_id: "D87",
      });
      await fixtures.chantierTerritoire({
        id: secondChantier.id,
        territoire_code: "DEPT-88",
        maille: "DEPT",
        code_insee: "88",
        zone_id: "D88",
      });
      await fixtures.chantierTerritoire({
        id: secondChantier.id,
        territoire_code: "REG-01",
        maille: "REG",
        code_insee: "01",
        zone_id: "RO1",
      });
      // chantierHorsListe : DEPT-87 (taux 18 — ignoré car hors de listeChantierIds)
      await fixtures.chantierTerritoire({
        id: chantierHorsListe.id,
        territoire_code: "DEPT-87",
        maille: "DEPT",
        code_insee: "87",
        zone_id: "D87",
      });

      await fixtures.chantierTerritoireJalon({
        id: premierChantier.id,
        territoire_code: "DEPT-87",
        maille: "DEPT",
        code_insee: "87",
        zone_id: "D87",
        jalon: 2025,
        taux_avancement: 10,
      });
      await fixtures.chantierTerritoireJalon({
        id: premierChantier.id,
        territoire_code: "DEPT-88",
        maille: "DEPT",
        code_insee: "88",
        zone_id: "D88",
        jalon: 2025,
        taux_avancement: 12,
      });
      await fixtures.chantierTerritoireJalon({
        id: secondChantier.id,
        territoire_code: "DEPT-87",
        maille: "DEPT",
        code_insee: "87",
        zone_id: "D87",
        jalon: 2025,
        taux_avancement: 14,
      });
      await fixtures.chantierTerritoireJalon({
        id: secondChantier.id,
        territoire_code: "DEPT-88",
        maille: "DEPT",
        code_insee: "88",
        zone_id: "D88",
        jalon: 2025,
        taux_avancement: 16,
      });
      await fixtures.chantierTerritoireJalon({
        id: secondChantier.id,
        territoire_code: "REG-01",
        maille: "REG",
        code_insee: "01",
        zone_id: "RO1",
        jalon: 2025,
        taux_avancement: 50,
      });
      await fixtures.chantierTerritoireJalon({
        id: chantierHorsListe.id,
        territoire_code: "DEPT-87",
        maille: "DEPT",
        code_insee: "87",
        zone_id: "D87",
        jalon: 2025,
        taux_avancement: 18,
      });

      // When
      const result = await query.execute({
        listeChantier: listeChantierIds,
        maille: "departementale",
        jalon: 2025,
      });

      // Then
      // premierChantier : [10, 12] → min=10, médiane=11, max=12
      // secondChantier : [14, 16] → min=14, médiane=15, max=16
      expect(result).toEqual(
        new Map([
          [premierChantier.id, { minimum: 10, médiane: 11, maximum: 12 }],
          [secondChantier.id, { minimum: 14, médiane: 15, maximum: 16 }],
        ]),
      );
    }),
  );

  it(
    "quand le nombre de territoires par chantier est impair, doit récupérer les statistiques pour chaque chantier séparément",
    createIntegrationTest(async () => {
      // Given
      const premierChantier = await fixtures.chantierIdentite();
      const secondChantier = await fixtures.chantierIdentite();
      const chantierHorsListe = await fixtures.chantierIdentite();
      const listeChantierIds = [premierChantier.id, secondChantier.id];

      // premierChantier : DEPT-87 (taux 10), DEPT-88 (taux 12), DEPT-89 (taux 22)
      await fixtures.chantierTerritoire({
        id: premierChantier.id,
        territoire_code: "DEPT-87",
        maille: "DEPT",
        code_insee: "87",
        zone_id: "D87",
      });
      await fixtures.chantierTerritoire({
        id: premierChantier.id,
        territoire_code: "DEPT-88",
        maille: "DEPT",
        code_insee: "88",
        zone_id: "D88",
      });
      await fixtures.chantierTerritoire({
        id: premierChantier.id,
        territoire_code: "DEPT-89",
        maille: "DEPT",
        code_insee: "89",
        zone_id: "D89",
      });
      // secondChantier : DEPT-87 (taux 14), DEPT-88 (taux 16)
      await fixtures.chantierTerritoire({
        id: secondChantier.id,
        territoire_code: "DEPT-87",
        maille: "DEPT",
        code_insee: "87",
        zone_id: "D87",
      });
      await fixtures.chantierTerritoire({
        id: secondChantier.id,
        territoire_code: "DEPT-88",
        maille: "DEPT",
        code_insee: "88",
        zone_id: "D88",
      });
      // chantierHorsListe : DEPT-87 (taux 18 — ignoré car hors de listeChantierIds)
      await fixtures.chantierTerritoire({
        id: chantierHorsListe.id,
        territoire_code: "DEPT-87",
        maille: "DEPT",
        code_insee: "87",
        zone_id: "D87",
      });

      await fixtures.chantierTerritoireJalon({
        id: premierChantier.id,
        territoire_code: "DEPT-87",
        maille: "DEPT",
        code_insee: "87",
        zone_id: "D87",
        jalon: 2025,
        taux_avancement: 10,
      });
      await fixtures.chantierTerritoireJalon({
        id: premierChantier.id,
        territoire_code: "DEPT-88",
        maille: "DEPT",
        code_insee: "88",
        zone_id: "D88",
        jalon: 2025,
        taux_avancement: 12,
      });
      await fixtures.chantierTerritoireJalon({
        id: premierChantier.id,
        territoire_code: "DEPT-89",
        maille: "DEPT",
        code_insee: "89",
        zone_id: "D89",
        jalon: 2025,
        taux_avancement: 22,
      });
      await fixtures.chantierTerritoireJalon({
        id: secondChantier.id,
        territoire_code: "DEPT-87",
        maille: "DEPT",
        code_insee: "87",
        zone_id: "D87",
        jalon: 2025,
        taux_avancement: 14,
      });
      await fixtures.chantierTerritoireJalon({
        id: secondChantier.id,
        territoire_code: "DEPT-88",
        maille: "DEPT",
        code_insee: "88",
        zone_id: "D88",
        jalon: 2025,
        taux_avancement: 16,
      });
      await fixtures.chantierTerritoireJalon({
        id: chantierHorsListe.id,
        territoire_code: "DEPT-87",
        maille: "DEPT",
        code_insee: "87",
        zone_id: "D87",
        jalon: 2025,
        taux_avancement: 18,
      });

      // When
      const result = await query.execute({
        listeChantier: listeChantierIds,
        maille: "departementale",
        jalon: 2025,
      });

      // Then
      // premierChantier : [10, 12, 22] → min=10, médiane=12, max=22
      // secondChantier : [14, 16] → min=14, médiane=15, max=16
      expect(result).toEqual(
        new Map([
          [premierChantier.id, { minimum: 10, médiane: 12, maximum: 22 }],
          [secondChantier.id, { minimum: 14, médiane: 15, maximum: 16 }],
        ]),
      );
    }),
  );

  it(
    "calcule les statistiques pour le jalon sélectionné",
    createIntegrationTest(async () => {
      // Given
      const premierChantier = await fixtures.chantierIdentite();
      const secondChantier = await fixtures.chantierIdentite();
      const listeChantierIds = [premierChantier.id, secondChantier.id];

      await fixtures.chantierTerritoire({
        id: premierChantier.id,
        territoire_code: "DEPT-87",
        maille: "DEPT",
        code_insee: "87",
        zone_id: "D87",
      });
      await fixtures.chantierTerritoire({
        id: secondChantier.id,
        territoire_code: "DEPT-87",
        maille: "DEPT",
        code_insee: "87",
        zone_id: "D87",
      });

      // Jalon 2025
      await fixtures.chantierTerritoireJalon({
        id: premierChantier.id,
        territoire_code: "DEPT-87",
        maille: "DEPT",
        code_insee: "87",
        zone_id: "D87",
        jalon: 2025,
        taux_avancement: 10,
      });
      await fixtures.chantierTerritoireJalon({
        id: secondChantier.id,
        territoire_code: "DEPT-87",
        maille: "DEPT",
        code_insee: "87",
        zone_id: "D87",
        jalon: 2025,
        taux_avancement: 20,
      });
      // Jalon 2026 — ne doit pas être pris en compte
      await fixtures.chantierTerritoireJalon({
        id: premierChantier.id,
        territoire_code: "DEPT-87",
        maille: "DEPT",
        code_insee: "87",
        zone_id: "D87",
        jalon: 2026,
        taux_avancement: 80,
      });
      await fixtures.chantierTerritoireJalon({
        id: secondChantier.id,
        territoire_code: "DEPT-87",
        maille: "DEPT",
        code_insee: "87",
        zone_id: "D87",
        jalon: 2026,
        taux_avancement: 90,
      });

      // When
      const result = await query.execute({
        listeChantier: listeChantierIds,
        maille: "departementale",
        jalon: 2025,
      });

      // Then
      // premierChantier : [10] → min=médiane=max=10
      // secondChantier : [20] → min=médiane=max=20
      expect(result).toEqual(
        new Map([
          [premierChantier.id, { minimum: 10, médiane: 10, maximum: 10 }],
          [secondChantier.id, { minimum: 20, médiane: 20, maximum: 20 }],
        ]),
      );
    }),
  );
});
