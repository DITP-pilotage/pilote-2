import { createIntegrationTest } from "@/server/infrastructure/test/createIntegrationTest";
import { fixtures } from "@/server/infrastructure/test/fixtures";
import { GetIndicateurPVACountTerritoiresQuery } from "@/server/chantiers/infrastructure/queries/GetIndicateurPVACountTerritoiresQuery";
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

describe("GetIndicateurPVACountTerritoiresQuery", () => {
  const prismaPilote = new PrismaPilote();
  let query: GetIndicateurPVACountTerritoiresQuery;

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

    query = new GetIndicateurPVACountTerritoiresQuery({
      listerDetailsIndicateurTerritoireUseCaseV2:
        new ListerDetailsIndicateurTerritoireUseCaseV2({
          indicateurRepository,
          datajobsExecutionQueries,
        }),
      territoireRepository,
    });
  });

  it(
    "retourne nombrePropositionsValeur à 1 quand une proposition est active",
    createIntegrationTest(async () => {
      // Given
      const auteur = await fixtures.utilisateur();
      await fixtures.chantierIdentite({ id: "CH-001" });
      await fixtures.chantierTerritoire({
        id: "CH-001",
        territoire_code: "DEPT-75",
        code_insee: "75",
        maille: "DEPT",
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
      await fixtures.indicateurTerritoireValeurEvenement({
        indic_id: "IND-001",
        territoire_code: "DEPT-75",
        id_auteur_modification: auteur.id,
        type_evenement: "PROPOSITION_VALEUR_CREEE",
      });

      // When
      const result = await query.execute({
        indicateurId: "IND-001",
        chantierId: "CH-001",
        jalon: 2025,
        habilitations: habilitationsPourChantier("CH-001", ["DEPT-75"]),
        profil: ProfilEnum.DITP_ADMIN,
      });

      // Then
      expect(result).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            territoireCode: "DEPT-75",
            nombrePropositionsValeur: 1,
          }),
        ]),
      );
    }),
  );

  it(
    "retourne nombrePropositionsValeur à 0 quand aucun événement de proposition",
    createIntegrationTest(async () => {
      // Given
      await fixtures.chantierIdentite({ id: "CH-002" });
      await fixtures.chantierTerritoire({
        id: "CH-002",
        territoire_code: "DEPT-75",
        code_insee: "75",
        maille: "DEPT",
        zone_id: "D75",
      });
      await fixtures.indicateurIdentite({
        id: "IND-002",
        chantier_id: "CH-002",
        statut: "PUBLIE",
      });
      await fixtures.indicateurTerritoire({
        id: "IND-002",
        chantier_id: "CH-002",
        territoire_code: "DEPT-75",
        code_insee: "75",
        maille: "DEPT",
        zone_id: "D75",
        est_applicable: true,
      });

      // When
      const result = await query.execute({
        indicateurId: "IND-002",
        chantierId: "CH-002",
        jalon: 2025,
        habilitations: habilitationsPourChantier("CH-002", ["DEPT-75"]),
        profil: ProfilEnum.DITP_ADMIN,
      });

      // Then
      expect(result).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            territoireCode: "DEPT-75",
            nombrePropositionsValeur: 0,
          }),
        ]),
      );
    }),
  );

  it(
    "retourne nombrePropositionsValeur à 0 quand la proposition est terminée",
    createIntegrationTest(async () => {
      // Given
      const auteur = await fixtures.utilisateur();
      await fixtures.chantierIdentite({ id: "CH-003" });
      await fixtures.chantierTerritoire({
        id: "CH-003",
        territoire_code: "DEPT-75",
        code_insee: "75",
        maille: "DEPT",
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
        territoire_code: "DEPT-75",
        code_insee: "75",
        maille: "DEPT",
        zone_id: "D75",
        est_applicable: true,
      });
      // Older event: proposition created
      await fixtures.indicateurTerritoireValeurEvenement({
        indic_id: "IND-003",
        territoire_code: "DEPT-75",
        id_auteur_modification: auteur.id,
        type_evenement: "PROPOSITION_VALEUR_CREEE",
        date_creation: new Date("2024-01-01"),
        ordre: 1,
      });
      // Newer event: proposition deleted (terminated)
      await fixtures.indicateurTerritoireValeurEvenement({
        indic_id: "IND-003",
        territoire_code: "DEPT-75",
        id_auteur_modification: auteur.id,
        type_evenement: "PROPOSITION_VALEUR_SUPPRIMEE",
        date_creation: new Date("2024-01-02"),
        ordre: 1,
      });

      // When
      const result = await query.execute({
        indicateurId: "IND-003",
        chantierId: "CH-003",
        jalon: 2025,
        habilitations: habilitationsPourChantier("CH-003", ["DEPT-75"]),
        profil: ProfilEnum.DITP_ADMIN,
      });

      // Then
      expect(result).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            territoireCode: "DEPT-75",
            nombrePropositionsValeur: 0,
          }),
        ]),
      );
    }),
  );

  it(
    "retourne estApplicable correctement",
    createIntegrationTest(async () => {
      // Given
      await fixtures.chantierIdentite({ id: "CH-004" });
      await fixtures.chantierTerritoire({
        id: "CH-004",
        territoire_code: "DEPT-75",
        code_insee: "75",
        maille: "DEPT",
        zone_id: "D75",
      });
      await fixtures.chantierTerritoire({
        id: "CH-004",
        territoire_code: "DEPT-13",
        code_insee: "13",
        maille: "DEPT",
        zone_id: "D13",
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
      await fixtures.indicateurTerritoire({
        id: "IND-004",
        chantier_id: "CH-004",
        territoire_code: "DEPT-13",
        code_insee: "13",
        maille: "DEPT",
        zone_id: "D13",
        est_applicable: false,
      });

      // When
      const result = await query.execute({
        indicateurId: "IND-004",
        chantierId: "CH-004",
        jalon: 2025,
        habilitations: habilitationsPourChantier("CH-004", [
          "DEPT-75",
          "DEPT-13",
        ]),
        profil: ProfilEnum.DITP_ADMIN,
      });

      // Then
      expect(result).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            territoireCode: "DEPT-75",
            estApplicable: true,
          }),
          expect.objectContaining({
            territoireCode: "DEPT-13",
            estApplicable: false,
          }),
        ]),
      );
    }),
  );

  it(
    "retourne une liste vide quand le territoire n'est pas dans les habilitations",
    createIntegrationTest(async () => {
      // Given
      await fixtures.chantierIdentite({ id: "CH-005" });
      await fixtures.chantierTerritoire({
        id: "CH-005",
        territoire_code: "DEPT-75",
        code_insee: "75",
        maille: "DEPT",
        zone_id: "D75",
      });
      await fixtures.indicateurIdentite({
        id: "IND-005",
        chantier_id: "CH-005",
        statut: "PUBLIE",
      });
      await fixtures.indicateurTerritoire({
        id: "IND-005",
        chantier_id: "CH-005",
        territoire_code: "DEPT-75",
        code_insee: "75",
        maille: "DEPT",
        zone_id: "D75",
        est_applicable: true,
      });

      // When — territory not in habilitations
      const result = await query.execute({
        indicateurId: "IND-005",
        chantierId: "CH-005",
        jalon: 2025,
        habilitations: habilitationsPourChantier("CH-005", ["DEPT-13"]),
        profil: ProfilEnum.DITP_ADMIN,
      });

      // Then
      expect(result).toEqual([]);
    }),
  );
});
