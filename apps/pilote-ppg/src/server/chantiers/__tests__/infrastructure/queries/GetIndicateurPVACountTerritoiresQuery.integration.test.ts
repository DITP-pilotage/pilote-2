import { createIntegrationTest } from "@/test/createIntegrationTest";
import { fixtures } from "@/test/fixtures";
import { GetIndicateurPVACountTerritoiresQuery } from "@/server/chantiers/infrastructure/queries/GetIndicateurPVACountTerritoiresQuery";
import { ListerDetailsIndicateurTerritoireUseCase } from "@/server/chantiers/usecases/ListerDetailsIndicateurTerritoireUseCase";
import { PrismaIndicateurRepository } from "@/server/chantiers/infrastructure/adapters/PrismaIndicateurRepository";
import { PrismaTerritoireRepository } from "@/server/chantiers/infrastructure/adapters/PrismaTerritoireRepository";
import { DatajobsExecutionQueries } from "@/server/datajobs-execution/DatajobsExecution";
import { PrismaPilote } from "@/server/framework/persistence/PrismaPilote";
import { Habilitations } from "@/shared/utilisateur/habilitation/Habilitation.interface";
import { ProfilEnum } from "@/shared/profil/ProfilEnum";

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
      listerDetailsIndicateurTerritoireUseCase:
        new ListerDetailsIndicateurTerritoireUseCase({
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
      const chantier = await fixtures.chantierIdentite();
      await fixtures.chantierTerritoire({
        id: chantier.id,
        territoire_code: "DEPT-75",
        code_insee: "75",
        maille: "DEPT",
        zone_id: "D75",
      });
      const indicateur = await fixtures.indicateurIdentite({
        chantier_id: chantier.id,
        statut: "PUBLIE",
      });
      await fixtures.indicateurTerritoire({
        id: indicateur.id,
        chantier_id: chantier.id,
        territoire_code: "DEPT-75",
        code_insee: "75",
        maille: "DEPT",
        zone_id: "D75",
        est_applicable: true,
      });
      await fixtures.indicateurTerritoireValeurEvenement({
        indic_id: indicateur.id,
        territoire_code: "DEPT-75",
        id_auteur_modification: auteur.id,
        type_evenement: "PROPOSITION_VALEUR_CREEE",
      });

      // When
      const result = await query.execute({
        indicateurId: indicateur.id,
        chantierId: chantier.id,
        jalon: 2025,
        habilitations: habilitationsPourChantier(chantier.id, ["DEPT-75"]),
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
      const chantier = await fixtures.chantierIdentite();
      await fixtures.chantierTerritoire({
        id: chantier.id,
        territoire_code: "DEPT-75",
        code_insee: "75",
        maille: "DEPT",
        zone_id: "D75",
      });
      const indicateur = await fixtures.indicateurIdentite({
        chantier_id: chantier.id,
        statut: "PUBLIE",
      });
      await fixtures.indicateurTerritoire({
        id: indicateur.id,
        chantier_id: chantier.id,
        territoire_code: "DEPT-75",
        code_insee: "75",
        maille: "DEPT",
        zone_id: "D75",
        est_applicable: true,
      });

      // When
      const result = await query.execute({
        indicateurId: indicateur.id,
        chantierId: chantier.id,
        jalon: 2025,
        habilitations: habilitationsPourChantier(chantier.id, ["DEPT-75"]),
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
      const chantier = await fixtures.chantierIdentite();
      await fixtures.chantierTerritoire({
        id: chantier.id,
        territoire_code: "DEPT-75",
        code_insee: "75",
        maille: "DEPT",
        zone_id: "D75",
      });
      const indicateur = await fixtures.indicateurIdentite({
        chantier_id: chantier.id,
        statut: "PUBLIE",
      });
      await fixtures.indicateurTerritoire({
        id: indicateur.id,
        chantier_id: chantier.id,
        territoire_code: "DEPT-75",
        code_insee: "75",
        maille: "DEPT",
        zone_id: "D75",
        est_applicable: true,
      });
      // Older event: proposition created
      await fixtures.indicateurTerritoireValeurEvenement({
        indic_id: indicateur.id,
        territoire_code: "DEPT-75",
        id_auteur_modification: auteur.id,
        type_evenement: "PROPOSITION_VALEUR_CREEE",
        date_creation: new Date("2024-01-01"),
        ordre: 1,
      });
      // Newer event: proposition deleted (terminated)
      await fixtures.indicateurTerritoireValeurEvenement({
        indic_id: indicateur.id,
        territoire_code: "DEPT-75",
        id_auteur_modification: auteur.id,
        type_evenement: "PROPOSITION_VALEUR_SUPPRIMEE",
        date_creation: new Date("2024-01-02"),
        ordre: 1,
      });

      // When
      const result = await query.execute({
        indicateurId: indicateur.id,
        chantierId: chantier.id,
        jalon: 2025,
        habilitations: habilitationsPourChantier(chantier.id, ["DEPT-75"]),
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
      const chantier = await fixtures.chantierIdentite();
      await fixtures.chantierTerritoire({
        id: chantier.id,
        territoire_code: "DEPT-75",
        code_insee: "75",
        maille: "DEPT",
        zone_id: "D75",
      });
      await fixtures.chantierTerritoire({
        id: chantier.id,
        territoire_code: "DEPT-13",
        code_insee: "13",
        maille: "DEPT",
        zone_id: "D13",
      });
      const indicateur = await fixtures.indicateurIdentite({
        chantier_id: chantier.id,
        statut: "PUBLIE",
      });
      await fixtures.indicateurTerritoire({
        id: indicateur.id,
        chantier_id: chantier.id,
        territoire_code: "DEPT-75",
        code_insee: "75",
        maille: "DEPT",
        zone_id: "D75",
        est_applicable: true,
      });
      await fixtures.indicateurTerritoire({
        id: indicateur.id,
        chantier_id: chantier.id,
        territoire_code: "DEPT-13",
        code_insee: "13",
        maille: "DEPT",
        zone_id: "D13",
        est_applicable: false,
      });

      // When
      const result = await query.execute({
        indicateurId: indicateur.id,
        chantierId: chantier.id,
        jalon: 2025,
        habilitations: habilitationsPourChantier(chantier.id, [
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
    "lance une erreur quand le territoire n'est pas dans les habilitations",
    createIntegrationTest(async () => {
      // Given
      const chantier = await fixtures.chantierIdentite();
      await fixtures.chantierTerritoire({
        id: chantier.id,
        territoire_code: "DEPT-75",
        code_insee: "75",
        maille: "DEPT",
        zone_id: "D75",
      });
      const indicateur = await fixtures.indicateurIdentite({
        chantier_id: chantier.id,
        statut: "PUBLIE",
      });
      await fixtures.indicateurTerritoire({
        id: indicateur.id,
        chantier_id: chantier.id,
        territoire_code: "DEPT-75",
        code_insee: "75",
        maille: "DEPT",
        zone_id: "D75",
        est_applicable: true,
      });

      // When — territory not in habilitations
      // Then
      await expect(
        query.execute({
          indicateurId: indicateur.id,
          chantierId: chantier.id,
          jalon: 2025,
          habilitations: habilitationsPourChantier(chantier.id, ["DEPT-13"]),
          profil: ProfilEnum.DITP_ADMIN,
        }),
      ).rejects.toThrow(`indicateur '${indicateur.id}' non trouvé`);
    }),
  );
});
