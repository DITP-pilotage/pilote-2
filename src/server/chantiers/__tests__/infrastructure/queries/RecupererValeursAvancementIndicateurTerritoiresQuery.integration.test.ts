import { createIntegrationTest } from "@/server/infrastructure/test/createIntegrationTest";
import { fixtures } from "@/server/infrastructure/test/fixtures";
import { RecupererValeursAvancementIndicateurTerritoiresQuery } from "@/server/chantiers/infrastructure/queries/RecupererValeursAvancementIndicateurTerritoiresQuery";
import { ListerDetailsIndicateurTerritoireUseCaseV2 } from "@/server/chantiers/usecases/ListerDetailsIndicateurTerritoireUseCaseV2";
import { PrismaIndicateurRepository } from "@/server/chantiers/infrastructure/adapters/PrismaIndicateurRepository";
import { DatajobsExecutionQueries } from "@/server/datajobs-execution/DatajobsExecution";
import { PrismaPilote } from "@/server/db/PrismaPilote";
import { Habilitations } from "@/server/domain/utilisateur/habilitation/Habilitation.interface";
import { ProfilEnum } from "@/server/app/enum/profil.enum";

function habilitationsPourChantier(chantierId: string): Habilitations {
  return {
    lecture: {
      chantiers: [chantierId],
      territoires: ["DEPT-75", "DEPT-92", "REG-11", "NAT-FR"],
      périmètres: [],
    },
    saisieCommentaire: { chantiers: [], territoires: [], périmètres: [] },
    saisieIndicateur: { chantiers: [], territoires: [], périmètres: [] },
    responsabilite: { chantiers: [], territoires: [], périmètres: [] },
    gestionUtilisateur: { chantiers: [], territoires: [], périmètres: [] },
  };
}

describe("RecupererValeursAvancementIndicateurTerritoiresQuery", () => {
  const prismaPilote = new PrismaPilote();
  let query: RecupererValeursAvancementIndicateurTerritoiresQuery;

  beforeEach(() => {
    const indicateurRepository = new PrismaIndicateurRepository({
      prisma: prismaPilote,
    });
    const datajobsExecutionQueries = new DatajobsExecutionQueries({
      prisma: prismaPilote,
    });

    query = new RecupererValeursAvancementIndicateurTerritoiresQuery({
      listerDetailsIndicateurTerritoireUseCaseV2:
        new ListerDetailsIndicateurTerritoireUseCaseV2({
          indicateurRepository,
          datajobsExecutionQueries,
        }),
    });
  });

  it(
    "mappe les détails territoires en valeurs d'avancement",
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
        habilitations: habilitationsPourChantier("CH-001"),
        profil: ProfilEnum.DITP_ADMIN,
      });

      // then
      expect(result).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            territoireCode: "DEPT-75",
            valeurAvancement: 42,
            valeurCibleAnnuelle: 100,
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
        habilitations: habilitationsPourChantier("CH-002"),
        profil: ProfilEnum.DITP_ADMIN,
      });

      // then
      expect(result).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            territoireCode: "DEPT-92",
            valeurAvancement: null,
            valeurCibleAnnuelle: null,
            estApplicable: false,
          }),
        ]),
      );
    }),
  );
});
