import { createIntegrationTest } from "@/server/infrastructure/test/createIntegrationTest";
import { fixtures } from "@/server/infrastructure/test/fixtures";
import { PrismaPilote } from "@/server/db/PrismaPilote";
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
      const listeChantierIds = ["CH-001", "CH-002"];
      const habilitation = {
        lecture: {
          chantiers: ["CH-001", "CH-002", "CH-003", "CH-004"],
          territoires: ["NAT-FR"],
        },
      } as unknown as Utilisateur["habilitations"];

      await fixtures.chantierIdentite({ id: "CH-001" });
      await fixtures.chantierIdentite({ id: "CH-002" });
      await fixtures.chantierIdentite({ id: "CH-003" });

      // CH-001 : DEPT-87 (taux 10) et DEPT-88 (taux 12)
      await fixtures.chantierTerritoire({
        id: "CH-001",
        territoire_code: "DEPT-87",
        maille: "DEPT",
        code_insee: "87",
        zone_id: "D87",
      });
      await fixtures.chantierTerritoire({
        id: "CH-001",
        territoire_code: "DEPT-88",
        maille: "DEPT",
        code_insee: "88",
        zone_id: "D88",
      });
      // CH-002 : DEPT-87 (taux 14), DEPT-88 (taux 16), REG-01 (taux 50 — doit être ignoré car maille différente)
      await fixtures.chantierTerritoire({
        id: "CH-002",
        territoire_code: "DEPT-87",
        maille: "DEPT",
        code_insee: "87",
        zone_id: "D87",
      });
      await fixtures.chantierTerritoire({
        id: "CH-002",
        territoire_code: "DEPT-88",
        maille: "DEPT",
        code_insee: "88",
        zone_id: "D88",
      });
      await fixtures.chantierTerritoire({
        id: "CH-002",
        territoire_code: "REG-01",
        maille: "REG",
        code_insee: "01",
        zone_id: "RO1",
      });
      // CH-003 : DEPT-87 (taux 18 — doit être ignoré car hors de listeChantierIds)
      await fixtures.chantierTerritoire({
        id: "CH-003",
        territoire_code: "DEPT-87",
        maille: "DEPT",
        code_insee: "87",
        zone_id: "D87",
      });

      await fixtures.chantierTerritoireJalon({
        id: "CH-001",
        territoire_code: "DEPT-87",
        maille: "DEPT",
        code_insee: "87",
        zone_id: "D87",
        jalon: 2025,
        taux_avancement: 10,
      });
      await fixtures.chantierTerritoireJalon({
        id: "CH-001",
        territoire_code: "DEPT-88",
        maille: "DEPT",
        code_insee: "88",
        zone_id: "D88",
        jalon: 2025,
        taux_avancement: 12,
      });
      await fixtures.chantierTerritoireJalon({
        id: "CH-002",
        territoire_code: "DEPT-87",
        maille: "DEPT",
        code_insee: "87",
        zone_id: "D87",
        jalon: 2025,
        taux_avancement: 14,
      });
      await fixtures.chantierTerritoireJalon({
        id: "CH-002",
        territoire_code: "DEPT-88",
        maille: "DEPT",
        code_insee: "88",
        zone_id: "D88",
        jalon: 2025,
        taux_avancement: 16,
      });
      await fixtures.chantierTerritoireJalon({
        id: "CH-002",
        territoire_code: "REG-01",
        maille: "REG",
        code_insee: "01",
        zone_id: "RO1",
        jalon: 2025,
        taux_avancement: 50,
      });
      await fixtures.chantierTerritoireJalon({
        id: "CH-003",
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
      // DEPT-87 : moyenne(CH-001=10, CH-002=14) = 12, DEPT-88 : moyenne(CH-001=12, CH-002=16) = 14 → min=12, médiane=13, max=14
      expect(result).toEqual({ médiane: 13, maximum: 14, minimum: 12 });
    }),
  );

  it(
    "quand le nombre de territoire demandé est impair, doit récupérer les statistiques d'une liste de chantier",
    createIntegrationTest(async () => {
      // Given
      const listeChantierIds = ["CH-001", "CH-002"];
      const habilitation = {
        lecture: {
          chantiers: ["CH-001", "CH-002", "CH-003", "CH-004"],
          territoires: ["NAT-FR"],
        },
      } as unknown as Utilisateur["habilitations"];

      await fixtures.chantierIdentite({ id: "CH-001" });
      await fixtures.chantierIdentite({ id: "CH-002" });
      await fixtures.chantierIdentite({ id: "CH-003" });

      // CH-001 : DEPT-87 (taux 10), DEPT-88 (taux 12), DEPT-89 (taux 22)
      await fixtures.chantierTerritoire({
        id: "CH-001",
        territoire_code: "DEPT-87",
        maille: "DEPT",
        code_insee: "87",
        zone_id: "D87",
      });
      await fixtures.chantierTerritoire({
        id: "CH-001",
        territoire_code: "DEPT-88",
        maille: "DEPT",
        code_insee: "88",
        zone_id: "D88",
      });
      await fixtures.chantierTerritoire({
        id: "CH-001",
        territoire_code: "DEPT-89",
        maille: "DEPT",
        code_insee: "89",
        zone_id: "D89",
      });
      // CH-002 : DEPT-87 (taux 14), DEPT-88 (taux 16), REG-01 (taux 50 — ignoré)
      await fixtures.chantierTerritoire({
        id: "CH-002",
        territoire_code: "DEPT-87",
        maille: "DEPT",
        code_insee: "87",
        zone_id: "D87",
      });
      await fixtures.chantierTerritoire({
        id: "CH-002",
        territoire_code: "DEPT-88",
        maille: "DEPT",
        code_insee: "88",
        zone_id: "D88",
      });
      await fixtures.chantierTerritoire({
        id: "CH-002",
        territoire_code: "REG-01",
        maille: "REG",
        code_insee: "01",
        zone_id: "RO1",
      });
      // CH-003 : DEPT-87 (taux 18 — ignoré car hors de listeChantierIds)
      await fixtures.chantierTerritoire({
        id: "CH-003",
        territoire_code: "DEPT-87",
        maille: "DEPT",
        code_insee: "87",
        zone_id: "D87",
      });

      await fixtures.chantierTerritoireJalon({
        id: "CH-001",
        territoire_code: "DEPT-87",
        maille: "DEPT",
        code_insee: "87",
        zone_id: "D87",
        jalon: 2025,
        taux_avancement: 10,
      });
      await fixtures.chantierTerritoireJalon({
        id: "CH-001",
        territoire_code: "DEPT-88",
        maille: "DEPT",
        code_insee: "88",
        zone_id: "D88",
        jalon: 2025,
        taux_avancement: 12,
      });
      await fixtures.chantierTerritoireJalon({
        id: "CH-001",
        territoire_code: "DEPT-89",
        maille: "DEPT",
        code_insee: "89",
        zone_id: "D89",
        jalon: 2025,
        taux_avancement: 22,
      });
      await fixtures.chantierTerritoireJalon({
        id: "CH-002",
        territoire_code: "DEPT-87",
        maille: "DEPT",
        code_insee: "87",
        zone_id: "D87",
        jalon: 2025,
        taux_avancement: 14,
      });
      await fixtures.chantierTerritoireJalon({
        id: "CH-002",
        territoire_code: "DEPT-88",
        maille: "DEPT",
        code_insee: "88",
        zone_id: "D88",
        jalon: 2025,
        taux_avancement: 16,
      });
      await fixtures.chantierTerritoireJalon({
        id: "CH-002",
        territoire_code: "REG-01",
        maille: "REG",
        code_insee: "01",
        zone_id: "RO1",
        jalon: 2025,
        taux_avancement: 50,
      });
      await fixtures.chantierTerritoireJalon({
        id: "CH-003",
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
      const listeChantierIds = ["CH-001", "CH-002"];
      const habilitation = {
        lecture: {
          chantiers: ["CH-001", "CH-002"],
          territoires: ["NAT-FR"],
        },
      } as unknown as Utilisateur["habilitations"];

      await fixtures.chantierIdentite({ id: "CH-001" });
      await fixtures.chantierIdentite({ id: "CH-002" });

      await fixtures.chantierTerritoire({
        id: "CH-001",
        territoire_code: "DEPT-87",
        maille: "DEPT",
        code_insee: "87",
        zone_id: "D87",
      });
      await fixtures.chantierTerritoire({
        id: "CH-002",
        territoire_code: "DEPT-87",
        maille: "DEPT",
        code_insee: "87",
        zone_id: "D87",
      });

      // Jalon 2025
      await fixtures.chantierTerritoireJalon({
        id: "CH-001",
        territoire_code: "DEPT-87",
        maille: "DEPT",
        code_insee: "87",
        zone_id: "D87",
        jalon: 2025,
        taux_avancement: 10,
      });
      await fixtures.chantierTerritoireJalon({
        id: "CH-002",
        territoire_code: "DEPT-87",
        maille: "DEPT",
        code_insee: "87",
        zone_id: "D87",
        jalon: 2025,
        taux_avancement: 20,
      });
      // Jalon 2026 — valeurs différentes qui ne doivent pas être prises en compte
      await fixtures.chantierTerritoireJalon({
        id: "CH-001",
        territoire_code: "DEPT-87",
        maille: "DEPT",
        code_insee: "87",
        zone_id: "D87",
        jalon: 2026,
        taux_avancement: 80,
      });
      await fixtures.chantierTerritoireJalon({
        id: "CH-002",
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
      // DEPT-87 : moyenne(CH-001=10, CH-002=20) = 15 → un seul territoire donc min=médiane=max=15
      expect(result).toEqual({ médiane: 15, minimum: 15, maximum: 15 });
    }),
  );
});
