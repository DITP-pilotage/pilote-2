import { randomUUID } from "node:crypto";
import { createIntegrationTest } from "@/server/infrastructure/test/createIntegrationTest";
import { fixtures } from "@/server/infrastructure/test/fixtures";
import { PrismaPilote } from "@/server/db/PrismaPilote";
import { PrismaActiviteComptesQuery } from "@/server/gestion-utilisateur/infrastructure/queries/PrismaActiviteComptesQuery";
import { PrismaUtilisateursQuery } from "@/server/gestion-utilisateur/infrastructure/queries/PrismaUtilisateursQuery";
import { getPrisma } from "@/server/db/PrismaTransaction";
import { ProduireRapportsHebdomadairesUseCase } from "@/server/rapports-hebdomadaires/usecases/ProduireRapportsHebdomadairesUseCase";
import { GestionUtilisateurActiviteComptesGateway } from "@/server/rapports-hebdomadaires/infrastructure/adapters/GestionUtilisateurActiviteComptesGateway";
import { GestionUtilisateurCoordinateurGateway } from "@/server/rapports-hebdomadaires/infrastructure/adapters/GestionUtilisateurCoordinateurGateway";
import { PrismaRapportRepository } from "@/server/rapports-hebdomadaires/infrastructure/adapters/PrismaRapportRepository";

describe("ProduireRapportsHebdomadairesUseCase", () => {
  let useCase: ProduireRapportsHebdomadairesUseCase;
  const prismaPilote = new PrismaPilote();

  beforeEach(() => {
    const activiteComptesQuery = new PrismaActiviteComptesQuery({
      prisma: prismaPilote,
    });
    const activiteComptesGateway = new GestionUtilisateurActiviteComptesGateway(
      { activiteComptesQuery },
    );
    const utilisateursQuery = new PrismaUtilisateursQuery({
      prisma: prismaPilote,
    });
    const coordinateurGateway = new GestionUtilisateurCoordinateurGateway({
      utilisateursQuery,
    });
    const rapportRepository = new PrismaRapportRepository({
      prisma: prismaPilote,
    });

    useCase = new ProduireRapportsHebdomadairesUseCase({
      activiteComptesGateway,
      coordinateurGateway,
      rapportRepository,
    });
  });

  it(
    "crée des rapports pour les coordinateurs avec activité dans leur territoire",
    createIntegrationTest(async () => {
      // Given
      const territoireReg = await fixtures.territoire({
        code: randomUUID(),
        nom: "Île-de-France",
        maille: "REG",
      });

      const coordinateur = await fixtures.utilisateur({
        profilCode: "COORDINATEUR_REGION",
      });
      await fixtures.habilitation({
        utilisateurId: coordinateur.id,
        territoires: [territoireReg.code],
      });

      const compteCree = await fixtures.utilisateur({
        profilCode: "PREFET_REGION",
        date_creation: new Date(Date.now() - 1 * 60 * 60 * 1000),
      });
      await fixtures.habilitation({
        utilisateurId: compteCree.id,
        territoires: [territoireReg.code],
      });

      // When
      const result = await useCase.run();

      // Then
      expect(result.rapportsCrees).toBe(1);
      expect(result.coordinateursSansActivite).toBe(0);

      const prisma = getPrisma();
      const rapports = await prisma.rapport_hebdomadaire_coordinateur.findMany({
        where: { coordinateur_id: coordinateur.id },
      });
      expect(rapports).toHaveLength(1);
      expect(rapports[0].statut_envoi).toBe("CREE");
      expect(rapports[0].comptes_crees).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            email: compteCree.email,
          }),
        ]),
      );
    }),
  );

  it(
    "ne crée pas de rapport pour les coordinateurs sans activité",
    createIntegrationTest(async () => {
      // Given
      const territoireReg = await fixtures.territoire({
        code: randomUUID(),
        nom: "Île-de-France",
        maille: "REG",
      });

      const coordinateur = await fixtures.utilisateur({
        profilCode: "COORDINATEUR_REGION",
      });
      await fixtures.habilitation({
        utilisateurId: coordinateur.id,
        territoires: [territoireReg.code],
      });

      // When
      const result = await useCase.run();

      // Then
      expect(result.rapportsCrees).toBe(0);
      expect(result.coordinateursSansActivite).toBe(1);

      const prisma = getPrisma();
      const rapports = await prisma.rapport_hebdomadaire_coordinateur.findMany({
        where: { coordinateur_id: coordinateur.id },
      });
      expect(rapports).toHaveLength(0);
    }),
  );

  it(
    "les coordinateurs régionaux reçoivent les événements de la région et des départements enfants",
    createIntegrationTest(async () => {
      // Given
      const territoireReg = await fixtures.territoire({
        code: randomUUID(),
        nom: "Île-de-France",
        maille: "REG",
      });

      const territoireDept = await fixtures.territoire({
        code: randomUUID(),
        nom: "Paris",
        maille: "DEPT",
        code_parent: territoireReg.code,
      });

      const coordinateur = await fixtures.utilisateur({
        profilCode: "COORDINATEUR_REGION",
      });
      await fixtures.habilitation({
        utilisateurId: coordinateur.id,
        territoires: [territoireReg.code],
      });

      const compteDansRegion = await fixtures.utilisateur({
        profilCode: "PREFET_REGION",
        date_creation: new Date(Date.now() - 1 * 60 * 60 * 1000),
      });
      await fixtures.habilitation({
        utilisateurId: compteDansRegion.id,
        territoires: [territoireReg.code],
      });

      const compteDansDept = await fixtures.utilisateur({
        profilCode: "PREFET_DEPARTEMENT",
        date_creation: new Date(Date.now() - 1 * 60 * 60 * 1000),
      });
      await fixtures.habilitation({
        utilisateurId: compteDansDept.id,
        territoires: [territoireDept.code],
      });

      // When
      const result = await useCase.run();

      // Then
      expect(result.rapportsCrees).toBe(1);

      const prisma = getPrisma();
      const rapports = await prisma.rapport_hebdomadaire_coordinateur.findMany({
        where: { coordinateur_id: coordinateur.id },
      });
      expect(rapports[0].comptes_crees).toHaveLength(2);
    }),
  );

  it(
    "les coordinateurs départementaux reçoivent uniquement les événements de leur département",
    createIntegrationTest(async () => {
      // Given
      const territoireReg = await fixtures.territoire({
        code: randomUUID(),
        nom: "Île-de-France",
        maille: "REG",
      });

      const territoireDept = await fixtures.territoire({
        code: randomUUID(),
        nom: "Paris",
        maille: "DEPT",
        code_parent: territoireReg.code,
      });

      const coordinateur = await fixtures.utilisateur({
        profilCode: "COORDINATEUR_DEPARTEMENT",
      });
      await fixtures.habilitation({
        utilisateurId: coordinateur.id,
        territoires: [territoireDept.code],
      });

      const compteDansRegion = await fixtures.utilisateur({
        profilCode: "PREFET_REGION",
        date_creation: new Date(Date.now() - 1 * 60 * 60 * 1000),
      });
      await fixtures.habilitation({
        utilisateurId: compteDansRegion.id,
        territoires: [territoireReg.code],
      });

      const compteDansDept = await fixtures.utilisateur({
        profilCode: "PREFET_DEPARTEMENT",
        date_creation: new Date(Date.now() - 1 * 60 * 60 * 1000),
      });
      await fixtures.habilitation({
        utilisateurId: compteDansDept.id,
        territoires: [territoireDept.code],
      });

      // When
      const result = await useCase.run();

      // Then
      expect(result.rapportsCrees).toBe(1);

      const prisma = getPrisma();
      const rapports = await prisma.rapport_hebdomadaire_coordinateur.findMany({
        where: { coordinateur_id: coordinateur.id },
      });
      expect(rapports[0].comptes_crees).toEqual([
        expect.objectContaining({
          email: compteDansDept.email,
        }),
      ]);
    }),
  );

  it(
    "filtre uniquement les profils tracés",
    createIntegrationTest(async () => {
      // Given
      const territoireReg = await fixtures.territoire({
        code: randomUUID(),
        nom: "Île-de-France",
        maille: "REG",
      });

      const coordinateur = await fixtures.utilisateur({
        profilCode: "COORDINATEUR_REGION",
      });
      await fixtures.habilitation({
        utilisateurId: coordinateur.id,
        territoires: [territoireReg.code],
      });

      const comptePrefet = await fixtures.utilisateur({
        profilCode: "PREFET_REGION",
        date_creation: new Date(Date.now() - 1 * 60 * 60 * 1000),
      });
      await fixtures.habilitation({
        utilisateurId: comptePrefet.id,
        territoires: [territoireReg.code],
      });

      const compteDitp = await fixtures.utilisateur({
        profilCode: "DITP_ADMIN",
        date_creation: new Date(Date.now() - 1 * 60 * 60 * 1000),
      });
      await fixtures.habilitation({
        utilisateurId: compteDitp.id,
        territoires: [territoireReg.code],
      });

      // When
      const result = await useCase.run();

      // Then
      expect(result.rapportsCrees).toBe(1);

      const prisma = getPrisma();
      const rapports = await prisma.rapport_hebdomadaire_coordinateur.findMany({
        where: { coordinateur_id: coordinateur.id },
      });
      expect(rapports[0].comptes_crees).toEqual([
        expect.objectContaining({
          email: comptePrefet.email,
        }),
      ]);
    }),
  );
});
