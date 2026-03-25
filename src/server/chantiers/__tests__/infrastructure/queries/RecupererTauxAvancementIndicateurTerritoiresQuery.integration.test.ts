import { createIntegrationTest } from "@/server/infrastructure/test/createIntegrationTest";
import { fixtures } from "@/server/infrastructure/test/fixtures";
import { RecupererTauxAvancementIndicateurTerritoiresQuery } from "@/server/chantiers/infrastructure/queries/RecupererTauxAvancementIndicateurTerritoiresQuery";
import { ListerDetailsIndicateurTerritoireUseCaseV2 } from "@/server/chantiers/usecases/ListerDetailsIndicateurTerritoireUseCaseV2";
import { PrismaIndicateurRepository } from "@/server/chantiers/infrastructure/adapters/PrismaIndicateurRepository";
import { PrismaTerritoireRepository } from "@/server/chantiers/infrastructure/adapters/PrismaTerritoireRepository";
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

describe("RecupererTauxAvancementIndicateurTerritoiresQuery", () => {
  const prismaPilote = new PrismaPilote();
  let query: RecupererTauxAvancementIndicateurTerritoiresQuery;

  beforeEach(() => {
    const indicateurRepository = new PrismaIndicateurRepository({
      prisma: prismaPilote,
    });
    const datajobsExecutionQueries = new DatajobsExecutionQueries({
      prisma: prismaPilote,
    });
    const territoireRepository = new PrismaTerritoireRepository({
      prisma: prismaPilote,
    });

    query = new RecupererTauxAvancementIndicateurTerritoiresQuery({
      listerDetailsIndicateurTerritoireUseCaseV2:
        new ListerDetailsIndicateurTerritoireUseCaseV2({
          indicateurRepository,
          datajobsExecutionQueries,
        }),
      territoireRepository,
    });
  });

  it(
    "mappe les détails territoires en taux d'avancement",
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
      });
      await fixtures.indicateurTerritoireJalon({
        id: "IND-001",
        territoire_code: "DEPT-75",
        code_insee: "75",
        maille: "DEPT",
        zone_id: "D75",
        jalon: 2025,
        valeur_actuelle: 42,
        valeur_cible: 100,
        taux_avancement: 42,
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
      expect(result).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            territoireCode: "DEPT-75",
            tauxAvancementJalon: 42,
            maille: "DEPT",
            estApplicable: true,
          }),
        ]),
      );
    }),
  );

  it(
    "retourne estApplicable false pour un territoire non applicable",
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
        est_applicable: false,
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
      expect(result).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            territoireCode: "DEPT-92",
            tauxAvancementJalon: null,
            estApplicable: false,
          }),
        ]),
      );
    }),
  );

  it(
    "détermine la maille correctement à partir du code territoire",
    createIntegrationTest(async () => {
      // given
      await fixtures.chantierIdentite({ id: "CH-003" });

      await fixtures.chantierTerritoire({
        id: "CH-003",
        territoire_code: "REG-11",
        maille: "REG",
        code_insee: "11",
        zone_id: "R11",
      });
      await fixtures.chantierTerritoire({
        id: "CH-003",
        territoire_code: "DEPT-75",
        maille: "DEPT",
        code_insee: "75",
        zone_id: "D75",
      });

      await fixtures.indicateurIdentite({
        id: "IND-003",
        chantier_id: "CH-003",
        statut: "PUBLIE",
      });

      await fixtures.indicateurTerritoire({
        id: "IND-003",
        chantier_id: "CH-003",
        territoire_code: "REG-11",
        code_insee: "11",
        maille: "REG",
        zone_id: "R11",
        est_applicable: true,
      });
      await fixtures.indicateurTerritoire({
        id: "IND-003",
        chantier_id: "CH-003",
        territoire_code: "DEPT-75",
        code_insee: "75",
        maille: "DEPT",
        zone_id: "D75",
        est_applicable: true,
      });

      await fixtures.indicateurTerritoireJalon({
        id: "IND-003",
        territoire_code: "REG-11",
        code_insee: "11",
        maille: "REG",
        zone_id: "R11",
        jalon: 2025,
        taux_avancement: 60,
      });
      await fixtures.indicateurTerritoireJalon({
        id: "IND-003",
        territoire_code: "DEPT-75",
        code_insee: "75",
        maille: "DEPT",
        zone_id: "D75",
        jalon: 2025,
        taux_avancement: 80,
      });

      // when
      const result = await query.execute({
        indicateurId: "IND-003",
        chantierId: "CH-003",
        jalon: 2025,
        habilitations: habilitationsPourChantier("CH-003", [
          "REG-11",
          "DEPT-75",
        ]),
        profil: ProfilEnum.DITP_ADMIN,
      });

      // then
      const reg = result.find((r) => r.territoireCode === "REG-11");
      const dept = result.find((r) => r.territoireCode === "DEPT-75");

      expect(reg).toEqual(
        expect.objectContaining({
          maille: "REG",
          tauxAvancementJalon: 60,
        }),
      );
      expect(dept).toEqual(
        expect.objectContaining({
          maille: "DEPT",
          tauxAvancementJalon: 80,
        }),
      );
    }),
  );

  it(
    "inclut le nom du territoire",
    createIntegrationTest(async () => {
      // given
      await fixtures.chantierIdentite({ id: "CH-004" });
      await fixtures.chantierTerritoire({
        id: "CH-004",
        territoire_code: "DEPT-75",
        maille: "DEPT",
        code_insee: "75",
        zone_id: "D75",
      });
      await fixtures.indicateurIdentite({
        id: "IND-004",
        chantier_id: "CH-004",
        statut: "PUBLIE",
      });
      await fixtures.indicateurTerritoire({
        id: "IND-004",
        chantier_id: "CH-004",
        territoire_code: "DEPT-75",
        code_insee: "75",
        maille: "DEPT",
        zone_id: "D75",
        est_applicable: true,
      });
      await fixtures.indicateurTerritoireJalon({
        id: "IND-004",
        territoire_code: "DEPT-75",
        code_insee: "75",
        maille: "DEPT",
        zone_id: "D75",
        jalon: 2025,
        taux_avancement: 50,
      });

      // when
      const result = await query.execute({
        indicateurId: "IND-004",
        chantierId: "CH-004",
        jalon: 2025,
        habilitations: habilitationsPourChantier("CH-004", ["DEPT-75"]),
        profil: ProfilEnum.DITP_ADMIN,
      });

      // then
      const dept75 = result.find((r) => r.territoireCode === "DEPT-75");
      expect(dept75).toBeDefined();
      expect(dept75!.territoireNom).not.toBe("");
    }),
  );
});
