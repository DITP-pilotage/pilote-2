import { createIntegrationTest } from "@/server/infrastructure/test/createIntegrationTest";
import { fixtures } from "@/server/infrastructure/test/fixtures";
import { RecupererEvolutionValeursAvancementTerritoiresQuery } from "@/server/chantiers/infrastructure/queries/RecupererEvolutionValeursAvancementTerritoiresQuery";
import { ListerDetailsIndicateurTerritoireUseCaseV2 } from "@/server/chantiers/usecases/ListerDetailsIndicateurTerritoireUseCaseV2";
import { PrismaIndicateurRepository } from "@/server/chantiers/infrastructure/adapters/PrismaIndicateurRepository";
import { DatajobsExecutionQueries } from "@/server/datajobs-execution/DatajobsExecution";
import { PrismaPilote } from "@/server/db/PrismaPilote";
import { Habilitations } from "@/server/domain/utilisateur/habilitation/Habilitation.interface";
import { ProfilEnum } from "@/server/app/enum/profil.enum";

function habilitationsPourChantier(
  chantierId: string,
  territoires: string[],
): Habilitations {
  return {
    lecture: {
      chantiers: [chantierId],
      territoires,
      périmètres: [],
    },
    saisieCommentaire: { chantiers: [], territoires: [], périmètres: [] },
    saisieIndicateur: { chantiers: [], territoires: [], périmètres: [] },
    responsabilite: { chantiers: [], territoires: [], périmètres: [] },
    gestionUtilisateur: { chantiers: [], territoires: [], périmètres: [] },
  };
}

describe("RecupererEvolutionValeursAvancementTerritoiresQuery", () => {
  const prismaPilote = new PrismaPilote();
  let query: RecupererEvolutionValeursAvancementTerritoiresQuery;

  beforeEach(() => {
    const indicateurRepository = new PrismaIndicateurRepository({
      prisma: prismaPilote,
    });
    const datajobsExecutionQueries = new DatajobsExecutionQueries({
      prisma: prismaPilote,
    });

    query = new RecupererEvolutionValeursAvancementTerritoiresQuery({
      listerDetailsIndicateurTerritoireUseCaseV2:
        new ListerDetailsIndicateurTerritoireUseCaseV2({
          indicateurRepository,
          datajobsExecutionQueries,
        }),
    });
  });

  it(
    "retourne l'historique des valeurs pour un territoire",
    createIntegrationTest(async () => {
      // given
      await fixtures.chantierIdentite({ id: "CH-001" });
      await fixtures.chantierTerritoire({
        id: "CH-001",
        territoire_code: "DEPT-75",
        maille: "DEPT",
        code_insee: "75",
        zone_id: "D75",
      });
      await fixtures.indicateurIdentite({
        id: "IND-001",
        chantier_id: "CH-001",
        statut: "PUBLIE",
      });
      await fixtures.indicateurTerritoire({
        id: "IND-001",
        chantier_id: "CH-001",
        territoire_code: "DEPT-75",
        code_insee: "75",
        maille: "DEPT",
        zone_id: "D75",
        est_applicable: true,
        evolution_avancement: [
          { date: new Date("2025-01-15"), valeur: 100 },
          { date: new Date("2025-06-15"), valeur: 200 },
        ],
      });
      await fixtures.indicateurTerritoireJalon({
        id: "IND-001",
        territoire_code: "DEPT-75",
        code_insee: "75",
        maille: "DEPT",
        zone_id: "D75",
        jalon: 2025,
        valeur_actuelle: 200,
        valeur_cible: 300,
        taux_avancement: 67,
      });

      // when
      const result = await query.execute({
        indicateurId: "IND-001",
        chantierId: "CH-001",
        jalon: 2025,
        habilitations: habilitationsPourChantier("CH-001", ["DEPT-75"]),
        profil: ProfilEnum.DITP_ADMIN,
      });

      // then
      expect(result).toEqual({
        territoires: [
          {
            territoireCode: "DEPT-75",
            historiquesValeurs: [
              { date: "2025-01-15T00:00:00.000Z", valeur: 100 },
              { date: "2025-06-15T00:00:00.000Z", valeur: 200 },
            ],
          },
        ],
      });
    }),
  );

  it(
    "exclut les territoires sans historique quand evolution_avancement est null",
    createIntegrationTest(async () => {
      // given
      await fixtures.chantierIdentite({ id: "CH-002" });
      await fixtures.chantierTerritoire({
        id: "CH-002",
        territoire_code: "DEPT-92",
        maille: "DEPT",
        code_insee: "92",
        zone_id: "D92",
      });
      await fixtures.indicateurIdentite({
        id: "IND-002",
        chantier_id: "CH-002",
        statut: "PUBLIE",
      });
      await fixtures.indicateurTerritoire({
        id: "IND-002",
        chantier_id: "CH-002",
        territoire_code: "DEPT-92",
        code_insee: "92",
        maille: "DEPT",
        zone_id: "D92",
        est_applicable: true,
      });
      await fixtures.indicateurTerritoireJalon({
        id: "IND-002",
        territoire_code: "DEPT-92",
        code_insee: "92",
        maille: "DEPT",
        zone_id: "D92",
        jalon: 2025,
        valeur_actuelle: null,
        valeur_cible: null,
      });

      // when
      const result = await query.execute({
        indicateurId: "IND-002",
        chantierId: "CH-002",
        jalon: 2025,
        habilitations: habilitationsPourChantier("CH-002", ["DEPT-92"]),
        profil: ProfilEnum.DITP_ADMIN,
      });

      // then
      expect(result).toEqual({ territoires: [] });
    }),
  );

  it(
    "retourne les historiques pour plusieurs territoires",
    createIntegrationTest(async () => {
      // given
      await fixtures.chantierIdentite({ id: "CH-003" });
      await fixtures.chantierTerritoire({
        id: "CH-003",
        territoire_code: "DEPT-75",
        maille: "DEPT",
        code_insee: "75",
        zone_id: "D75",
      });
      await fixtures.chantierTerritoire({
        id: "CH-003",
        territoire_code: "DEPT-92",
        maille: "DEPT",
        code_insee: "92",
        zone_id: "D92",
      });
      await fixtures.indicateurIdentite({
        id: "IND-003",
        chantier_id: "CH-003",
        statut: "PUBLIE",
      });
      await fixtures.indicateurTerritoire({
        id: "IND-003",
        chantier_id: "CH-003",
        territoire_code: "DEPT-75",
        code_insee: "75",
        maille: "DEPT",
        zone_id: "D75",
        est_applicable: true,
        evolution_avancement: [{ date: new Date("2025-03-01"), valeur: 50 }],
      });
      await fixtures.indicateurTerritoire({
        id: "IND-003",
        chantier_id: "CH-003",
        territoire_code: "DEPT-92",
        code_insee: "92",
        maille: "DEPT",
        zone_id: "D92",
        est_applicable: true,
        evolution_avancement: [
          { date: new Date("2025-04-01"), valeur: 75 },
          { date: new Date("2025-05-01"), valeur: 90 },
        ],
      });
      await fixtures.indicateurTerritoireJalon({
        id: "IND-003",
        territoire_code: "DEPT-75",
        code_insee: "75",
        maille: "DEPT",
        zone_id: "D75",
        jalon: 2025,
        valeur_actuelle: 50,
        valeur_cible: 100,
      });
      await fixtures.indicateurTerritoireJalon({
        id: "IND-003",
        territoire_code: "DEPT-92",
        code_insee: "92",
        maille: "DEPT",
        zone_id: "D92",
        jalon: 2025,
        valeur_actuelle: 90,
        valeur_cible: 100,
      });

      // when
      const result = await query.execute({
        indicateurId: "IND-003",
        chantierId: "CH-003",
        jalon: 2025,
        habilitations: habilitationsPourChantier("CH-003", [
          "DEPT-75",
          "DEPT-92",
        ]),
        profil: ProfilEnum.DITP_ADMIN,
      });

      // then
      expect(result).toEqual({
        territoires: expect.arrayContaining([
          {
            territoireCode: "DEPT-75",
            historiquesValeurs: [
              { date: "2025-03-01T00:00:00.000Z", valeur: 50 },
            ],
          },
          {
            territoireCode: "DEPT-92",
            historiquesValeurs: [
              { date: "2025-04-01T00:00:00.000Z", valeur: 75 },
              { date: "2025-05-01T00:00:00.000Z", valeur: 90 },
            ],
          },
        ]),
      });
    }),
  );

  it(
    "lance une erreur quand l'indicateur n'existe pas",
    createIntegrationTest(async () => {
      // given
      await fixtures.chantierIdentite({ id: "CH-004" });

      // when / then
      await expect(
        query.execute({
          indicateurId: "IND-INEXISTANT",
          chantierId: "CH-004",
          jalon: 2025,
          habilitations: habilitationsPourChantier("CH-004", ["DEPT-75"]),
          profil: ProfilEnum.DITP_ADMIN,
        }),
      ).rejects.toThrow("indicateur 'IND-INEXISTANT' non trouvé");
    }),
  );
});
