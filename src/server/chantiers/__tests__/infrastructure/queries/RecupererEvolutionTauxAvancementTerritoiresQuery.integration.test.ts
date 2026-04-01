import { createIntegrationTest } from "@/server/infrastructure/test/createIntegrationTest";
import { fixtures } from "@/server/infrastructure/test/fixtures";
import { RecupererEvolutionTauxAvancementTerritoiresQuery } from "@/server/chantiers/infrastructure/queries/RecupererEvolutionTauxAvancementTerritoiresQuery";
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

describe("RecupererEvolutionTauxAvancementTerritoiresQuery", () => {
  const prismaPilote = new PrismaPilote();
  let query: RecupererEvolutionTauxAvancementTerritoiresQuery;

  beforeEach(() => {
    const indicateurRepository = new PrismaIndicateurRepository({
      prisma: prismaPilote,
    });
    const datajobsExecutionQueries = new DatajobsExecutionQueries({
      prisma: prismaPilote,
    });

    query = new RecupererEvolutionTauxAvancementTerritoiresQuery({
      listerDetailsIndicateurTerritoireUseCaseV2:
        new ListerDetailsIndicateurTerritoireUseCaseV2({
          indicateurRepository,
          datajobsExecutionQueries,
        }),
    });
  });

  it(
    "extrait les taux d'avancement jalon depuis l'historique d'évolution",
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
          {
            date: new Date("2025-01-15"),
            valeur: 100,
            taux_avancement_jalon: 45.5,
          },
          {
            date: new Date("2025-06-15"),
            valeur: 200,
            taux_avancement_jalon: 67.2,
          },
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
        territoires: expect.arrayContaining([
          expect.objectContaining({
            territoireCode: "DEPT-75",
            historiquesValeurs: [
              { date: "2025-01-15T00:00:00.000Z", valeur: 45.5 },
              { date: "2025-06-15T00:00:00.000Z", valeur: 67.2 },
            ],
          }),
        ]),
      });
    }),
  );

  it(
    "filtre les entrées sans taux_avancement_jalon",
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
        evolution_avancement: [
          {
            date: new Date("2025-01-15"),
            valeur: 100,
            taux_avancement_jalon: 30,
          },
          {
            date: new Date("2025-03-15"),
            valeur: 150,
            taux_avancement_jalon: null,
          },
          { date: new Date("2025-06-15"), valeur: 200 },
        ],
      });
      await fixtures.indicateurTerritoireJalon({
        id: "IND-002",
        territoire_code: "DEPT-92",
        code_insee: "92",
        maille: "DEPT",
        zone_id: "D92",
        jalon: 2025,
        valeur_actuelle: 200,
        valeur_cible: 300,
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
      const territoire = result.territoires.find(
        (entry) => entry.territoireCode === "DEPT-92",
      );
      expect(territoire).toEqual(
        expect.objectContaining({
          territoireCode: "DEPT-92",
          historiquesValeurs: [
            { date: "2025-01-15T00:00:00.000Z", valeur: 30 },
          ],
        }),
      );
    }),
  );

  it(
    "retourne un historique vide quand evolution_avancement est null",
    createIntegrationTest(async () => {
      // given
      await fixtures.chantierIdentite({ id: "CH-003" });
      await fixtures.chantierTerritoire({
        id: "CH-003",
        territoire_code: "DEPT-33",
        maille: "DEPT",
        code_insee: "33",
        zone_id: "D33",
      });
      await fixtures.indicateurIdentite({
        id: "IND-003",
        chantier_id: "CH-003",
        statut: "PUBLIE",
      });
      await fixtures.indicateurTerritoire({
        id: "IND-003",
        chantier_id: "CH-003",
        territoire_code: "DEPT-33",
        code_insee: "33",
        maille: "DEPT",
        zone_id: "D33",
        est_applicable: true,
      });
      await fixtures.indicateurTerritoireJalon({
        id: "IND-003",
        territoire_code: "DEPT-33",
        code_insee: "33",
        maille: "DEPT",
        zone_id: "D33",
        jalon: 2025,
        valeur_actuelle: null,
        valeur_cible: null,
      });

      // when
      const result = await query.execute({
        indicateurId: "IND-003",
        chantierId: "CH-003",
        jalon: 2025,
        habilitations: habilitationsPourChantier("CH-003", ["DEPT-33"]),
        profil: ProfilEnum.DITP_ADMIN,
      });

      // then
      const territoire = result.territoires.find(
        (entry) => entry.territoireCode === "DEPT-33",
      );
      expect(territoire).toEqual(
        expect.objectContaining({
          territoireCode: "DEPT-33",
          historiquesValeurs: [],
        }),
      );
    }),
  );
});
