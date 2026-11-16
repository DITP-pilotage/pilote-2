import { randomUUID } from "node:crypto";
import { createIntegrationTest } from "@/test/createIntegrationTest";
import { fixtures } from "@/test/fixtures";
import { PrismaPilote } from "@/server/framework/persistence/PrismaPilote";
import { Utilisateur } from "@/server/gestion-utilisateur/domain/Utilisateur.interface";
import { GetStatistiquesAvancementChantiersQuery } from "@/server/chantiers/infrastructure/queries/GetStatistiquesAvancementChantiersQuery";

describe("GetStatistiquesAvancementChantiersQuery", () => {
  let query: GetStatistiquesAvancementChantiersQuery;

  beforeEach(() => {
    query = new GetStatistiquesAvancementChantiersQuery({
      prisma: new PrismaPilote(),
    });
  });

  it(
    "quand le nombre de territoire demandé est pair, doit récupérer les statistiques d'une liste de chantier",
    createIntegrationTest(async () => {
      // Given
      const premierChantier = await fixtures.chantierIdentite();
      const secondChantier = await fixtures.chantierIdentite();
      const chantierHorsListe = await fixtures.chantierIdentite();
      const listeChantierIds = [premierChantier.id, secondChantier.id];
      const habilitation = {
        lecture: {
          chantiers: [
            premierChantier.id,
            secondChantier.id,
            chantierHorsListe.id,
            randomUUID(),
          ],
          territoires: ["NAT-FR"],
        },
      } as unknown as Utilisateur["habilitations"];

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
      // secondChantier : DEPT-87 (taux 14), DEPT-88 (taux 16), REG-01 (taux 50 — doit être ignoré car maille différente)
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
      // chantierHorsListe : DEPT-87 (taux 18 — doit être ignoré car hors de listeChantierIds)
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
        habilitations: habilitation,
        listeChantier: listeChantierIds,
        maille: "departementale",
        jalon: 2025,
      });

      // Then
      // DEPT-87 : moyenne(premierChantier=10, secondChantier=14) = 12, DEPT-88 : moyenne(premierChantier=12, secondChantier=16) = 14 → min=12, médiane=13, max=14
      expect(result).toEqual({ médiane: 13, maximum: 14, minimum: 12 });
    }),
  );

  it(
    "quand le nombre de territoire demandé est impair, doit récupérer les statistiques d'une liste de chantier",
    createIntegrationTest(async () => {
      // Given
      const premierChantier = await fixtures.chantierIdentite();
      const secondChantier = await fixtures.chantierIdentite();
      const chantierHorsListe = await fixtures.chantierIdentite();
      const listeChantierIds = [premierChantier.id, secondChantier.id];
      const habilitation = {
        lecture: {
          chantiers: [
            premierChantier.id,
            secondChantier.id,
            chantierHorsListe.id,
            randomUUID(),
          ],
          territoires: ["NAT-FR"],
        },
      } as unknown as Utilisateur["habilitations"];

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
      // secondChantier : DEPT-87 (taux 14), DEPT-88 (taux 16), REG-01 (taux 50 — ignoré)
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
        habilitations: habilitation,
        listeChantier: listeChantierIds,
        maille: "departementale",
        jalon: 2025,
      });

      // Then
      // DEPT-87 : moyenne(10, 14)=12, DEPT-88 : moyenne(12, 16)=14, DEPT-89 : moyenne(22)=22 → min=12, médiane=14, max=22
      expect(result).toEqual({ médiane: 14, maximum: 22, minimum: 12 });
    }),
  );

  it(
    "calcule les statistiques pour le jalon sélectionné",
    createIntegrationTest(async () => {
      // Given
      const premierChantier = await fixtures.chantierIdentite();
      const secondChantier = await fixtures.chantierIdentite();
      const listeChantierIds = [premierChantier.id, secondChantier.id];
      const habilitation = {
        lecture: {
          chantiers: [premierChantier.id, secondChantier.id],
          territoires: ["NAT-FR"],
        },
      } as unknown as Utilisateur["habilitations"];

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
      // Jalon 2026 — valeurs différentes qui ne doivent pas être prises en compte
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
        habilitations: habilitation,
        listeChantier: listeChantierIds,
        maille: "departementale",
        jalon: 2025,
      });

      // Then
      // DEPT-87 : moyenne(premierChantier=10, secondChantier=20) = 15 → un seul territoire donc min=médiane=max=15
      expect(result).toEqual({ médiane: 15, minimum: 15, maximum: 15 });
    }),
  );
});
