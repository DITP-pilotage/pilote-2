import { createIntegrationTest } from "@/server/infrastructure/test/createIntegrationTest";
import { fixtures } from "@/server/infrastructure/test/fixtures";
import { PrismaPilote } from "@/server/db/PrismaPilote";
import { getPrisma } from "@/server/db/PrismaTransaction";
import { EnvoyerRapportsHebdomadairesUseCase } from "@/server/rapports-hebdomadaires/usecases/EnvoyerRapportsHebdomadairesUseCase";
import { PrismaRapportRepository } from "@/server/rapports-hebdomadaires/infrastructure/adapters/PrismaRapportRepository";
import { EnvoieEmailService } from "@/server/rapports-hebdomadaires/domain/ports/EnvoieEmailService";

class StubEnvoieEmailServiceSuccess implements EnvoieEmailService {
  async envoyerRapportHebdomadaire(): Promise<void> {
    return Promise.resolve();
  }
}

class StubEnvoieEmailServiceFailure implements EnvoieEmailService {
  async envoyerRapportHebdomadaire(): Promise<void> {
    throw new Error("Timeout Brevo");
  }
}

describe("EnvoyerRapportsHebdomadairesUseCase", () => {
  const prismaPilote = new PrismaPilote();

  it(
    "envoie les emails pour tous les rapports avec statut CREE",
    createIntegrationTest(async () => {
      // Given
      const prisma = getPrisma();
      const dateCreation = new Date();

      const rapport1 = await fixtures.rapportHebdomadaireCoordinateur({
        date_creation: dateCreation,
      });

      const rapport2 = await fixtures.rapportHebdomadaireCoordinateur({
        date_creation: dateCreation,
      });

      const rapportRepository = new PrismaRapportRepository({
        prisma: prismaPilote,
      });
      const envoieEmailService = new StubEnvoieEmailServiceSuccess();
      const useCase = new EnvoyerRapportsHebdomadairesUseCase({
        rapportRepository,
        envoieEmailService,
      });

      // When
      const result = await useCase.run({ dateCreationMin: dateCreation });

      // Then
      expect(result.emailsEnvoyes).toBe(2);
      expect(result.emailsEnEchec).toBe(0);

      const rapportsApres =
        await prisma.rapport_hebdomadaire_coordinateur.findMany({
          where: { id: { in: [rapport1.id, rapport2.id] } },
        });

      expect(rapportsApres).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: rapport1.id,
            statut_envoi: "ENVOYE",
            date_envoi: expect.any(Date),
            nombre_tentatives: 1,
          }),
          expect.objectContaining({
            id: rapport2.id,
            statut_envoi: "ENVOYE",
            date_envoi: expect.any(Date),
            nombre_tentatives: 1,
          }),
        ]),
      );
    }),
  );

  it(
    "marque les rapports en ECHEC en cas d'erreur d'envoi",
    createIntegrationTest(async () => {
      // Given
      const prisma = getPrisma();
      const dateCreation = new Date();

      const rapport = await fixtures.rapportHebdomadaireCoordinateur({
        date_creation: dateCreation,
      });

      const rapportRepository = new PrismaRapportRepository({
        prisma: prismaPilote,
      });
      const envoieEmailService = new StubEnvoieEmailServiceFailure();
      const useCase = new EnvoyerRapportsHebdomadairesUseCase({
        rapportRepository,
        envoieEmailService,
      });

      // When
      const result = await useCase.run({ dateCreationMin: dateCreation });

      // Then
      expect(result.emailsEnvoyes).toBe(0);
      expect(result.emailsEnEchec).toBe(1);
      expect(result.erreursDetails).toEqual([
        {
          email: "coordinateur@example.com",
          erreur: "Timeout Brevo",
        },
      ]);

      const rapportApres =
        await prisma.rapport_hebdomadaire_coordinateur.findUnique({
          where: { id: rapport.id },
        });

      expect(rapportApres).toEqual(
        expect.objectContaining({
          statut_envoi: "ECHEC",
          erreur_envoi: "Timeout Brevo",
          nombre_tentatives: 1,
          date_derniere_tentative: expect.any(Date),
        }),
      );
    }),
  );

  it(
    "continue l'envoi même si certains emails échouent",
    createIntegrationTest(async () => {
      // Given
      const prisma = getPrisma();
      const dateCreation = new Date();

      const rapport1 = await fixtures.rapportHebdomadaireCoordinateur({
        date_creation: dateCreation,
      });

      const rapport2 = await fixtures.rapportHebdomadaireCoordinateur({
        date_creation: dateCreation,
      });

      let callCount = 0;
      class StubEnvoieEmailServiceMixed implements EnvoieEmailService {
        async envoyerRapportHebdomadaire(): Promise<void> {
          callCount++;
          if (callCount === 1) {
            throw new Error("Échec premier email");
          }
          return Promise.resolve();
        }
      }

      const rapportRepository = new PrismaRapportRepository({
        prisma: prismaPilote,
      });
      const envoieEmailService = new StubEnvoieEmailServiceMixed();
      const useCase = new EnvoyerRapportsHebdomadairesUseCase({
        rapportRepository,
        envoieEmailService,
      });

      // When
      const result = await useCase.run({ dateCreationMin: dateCreation });

      // Then
      expect(result.emailsEnvoyes).toBe(1);
      expect(result.emailsEnEchec).toBe(1);

      const rapport1Apres =
        await prisma.rapport_hebdomadaire_coordinateur.findUnique({
          where: { id: rapport1.id },
        });
      const rapport2Apres =
        await prisma.rapport_hebdomadaire_coordinateur.findUnique({
          where: { id: rapport2.id },
        });

      expect(rapport1Apres?.statut_envoi).toBe("ECHEC");
      expect(rapport2Apres?.statut_envoi).toBe("ENVOYE");
    }),
  );

  it(
    "envoie uniquement les rapports créés après dateCreationMin",
    createIntegrationTest(async () => {
      // Given
      const dateAncienne = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const dateRecente = new Date();

      await fixtures.rapportHebdomadaireCoordinateur({
        date_creation: dateAncienne,
      });

      await fixtures.rapportHebdomadaireCoordinateur({
        date_creation: dateRecente,
      });

      const rapportRepository = new PrismaRapportRepository({
        prisma: prismaPilote,
      });
      const envoieEmailService = new StubEnvoieEmailServiceSuccess();
      const useCase = new EnvoyerRapportsHebdomadairesUseCase({
        rapportRepository,
        envoieEmailService,
      });

      // When
      const result = await useCase.run({ dateCreationMin: dateRecente });

      // Then
      expect(result.emailsEnvoyes).toBe(1);
      expect(result.emailsEnEchec).toBe(0);
    }),
  );
});
