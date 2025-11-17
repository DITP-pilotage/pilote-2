import { EnregistrerBrouillonAutoEvaluationObjectifsHandler } from "@/server/evaluation/handlers/EnregistrerBrouillonAutoEvaluationObjectifsHandler";
import { PrismaPilote } from "@/server/db/PrismaPilote";
import { prisma } from "@/server/db/prisma";
import { PrismaTransaction } from "@/server/db/PrismaTransaction";

describe("EnregistrerBrouillonAutoEvaluationObjectifsHandler", () => {
  let handler: EnregistrerBrouillonAutoEvaluationObjectifsHandler;
  const prismaPilote = new PrismaPilote();
  const transaction = new PrismaTransaction();

  beforeEach(() => {
    handler = new EnregistrerBrouillonAutoEvaluationObjectifsHandler({
      prisma: prismaPilote,
      transaction,
    });
  });

  describe("execute", () => {
    it("doit créer de nouvelles évaluations d'objectifs quand aucune n'existe", async () => {
      // Given
      const rattachementCode = "REG-200";
      const objectifId = "c3d4e5f6-a7b8-9012-cdef-123456789012";
      const ficheEvaluationId = "d4e5f6a7-b8c9-0123-def1-234567890123";
      const etapeEvaluationId = "e5f6a7b8-c9d0-1234-ef12-345678901234";
      const utilisateurId = "f6a7b8c9-d0e1-2345-f123-456789012345";
      const evaluationObjectifId = "a7b8c9d0-e1f2-3456-1234-567890123456";

      await prisma.utilisateur.create({
        data: {
          id: utilisateurId,
          email: "test-objectifs@example.com",
          nom: "Test",
          prenom: "User",
          date_creation: new Date(),
          profilCode: "DITP_ADMIN",
        },
      });

      await prisma.referentiel_rattachement.create({
        data: {
          code: rattachementCode,
          groupe: rattachementCode,
          ordre: 1,
          libelle: "Rattachement test objectifs",
          objectifs: {
            create: {
              id: objectifId,
              libelle: "Objectif test",
              descriptif: "Description",
              jalon: 2025,
            },
          },
        },
      });

      await prisma.fiche_evaluation.create({
        data: {
          id: ficheEvaluationId,
          jalon: 2025,
          etape_courante: "AUTO_EVALUATION",
          rattachement_code: rattachementCode,
          etape_evaluations: {
            create: {
              id: etapeEvaluationId,
              type: "AUTO_EVALUATION",
            },
          },
        },
      });

      // When
      await handler.execute(
        {
          ficheEvaluationId,
          evaluationsObjectifs: [
            {
              id: evaluationObjectifId,
              objectifId,
              note: 4,
              commentaire: "Bon objectif",
              annexe: "une annexe",
            },
          ],
        },
        utilisateurId,
      );

      // Then
      const evaluationObjectif = await prisma.evaluation_objectif.findUnique({
        where: { id: evaluationObjectifId },
      });
      expect(evaluationObjectif).toMatchObject({
        id: evaluationObjectifId,
        etape_evaluation_id: etapeEvaluationId,
        objectif_id: objectifId,
        auteur_id: utilisateurId,
        note: 4,
        commentaire: "Bon objectif",
        annexe: "une annexe",
      });
    });

    it("doit mettre à jour des évaluations d'objectifs existantes", async () => {
      // Given
      const rattachementCode = "REG-201";
      const objectifId = "9cad0c79-9c7a-4e4e-b386-210e467cdb78";
      const ficheEvaluationId = "0551e912-668a-4623-8351-7ceff6fd2a77";
      const etapeEvaluationId = "64f04ba8-85bf-4ba0-be83-b42e8dd5a5e0";
      const utilisateurId = "c647fa2f-c8e2-4a6b-b347-62abf24ff3d2";
      const evaluationObjectifId = "9d8b66e1-1378-4982-9b9e-947b2b4c520b";

      await prisma.utilisateur.create({
        data: {
          id: utilisateurId,
          email: "test-objectifs2@example.com",
          nom: "Test2",
          prenom: "User",
          date_creation: new Date(),
          profilCode: "DITP_ADMIN",
        },
      });

      await prisma.referentiel_rattachement.create({
        data: {
          code: rattachementCode,
          groupe: rattachementCode,
          ordre: 1,
          libelle: "Rattachement update objectifs",
          objectifs: {
            create: {
              id: objectifId,
              libelle: "Objectif update",
              descriptif: "Description",
              jalon: 2025,
            },
          },
        },
      });

      await prisma.fiche_evaluation.create({
        data: {
          id: ficheEvaluationId,
          jalon: 2025,
          etape_courante: "AUTO_EVALUATION",
          rattachement_code: rattachementCode,
          etape_evaluations: {
            create: {
              id: etapeEvaluationId,
              type: "AUTO_EVALUATION",
            },
          },
        },
      });

      await prisma.evaluation_objectif.create({
        data: {
          id: evaluationObjectifId,
          etape_evaluation_id: etapeEvaluationId,
          objectif_id: objectifId,
          auteur_id: utilisateurId,
          note: 2,
          commentaire: "Initial comment",
        },
      });

      // When
      await handler.execute(
        {
          ficheEvaluationId,
          evaluationsObjectifs: [
            {
              id: evaluationObjectifId,
              objectifId,
              note: 5,
              commentaire: "Updated comment",
              annexe: "une annexe",
            },
          ],
        },
        utilisateurId,
      );

      // Then
      const evaluationObjectif = await prisma.evaluation_objectif.findUnique({
        where: { id: evaluationObjectifId },
      });
      expect(evaluationObjectif).toMatchObject({
        note: 5,
        commentaire: "Updated comment",
        annexe: "une annexe",
      });
    });

    it("doit mettre à jour la date de modification de l'étape", async () => {
      // Given
      const rattachementCode = "REG-202";
      const ficheEvaluationId = "f7084502-ded0-4ee6-a77c-cf5b8d2b944e";
      const etapeEvaluationId = "c0009d4e-461f-403d-905e-08f8e0c486b8";
      const utilisateurId = "e04b836d-a46e-4de9-9518-afd711b83733";

      await prisma.utilisateur.create({
        data: {
          id: utilisateurId,
          email: "test-objectifs3@example.com",
          nom: "Test3",
          prenom: "User",
          date_creation: new Date(),
          profilCode: "DITP_ADMIN",
        },
      });

      await prisma.referentiel_rattachement.create({
        data: {
          code: rattachementCode,
          groupe: rattachementCode,
          ordre: 1,
          libelle: "Rattachement date objectifs",
        },
      });

      const initialDate = new Date("2025-01-01T00:00:00Z");
      await prisma.fiche_evaluation.create({
        data: {
          id: ficheEvaluationId,
          jalon: 2025,
          etape_courante: "AUTO_EVALUATION",
          rattachement_code: rattachementCode,
          etape_evaluations: {
            create: {
              id: etapeEvaluationId,
              type: "AUTO_EVALUATION",
              updated_at: initialDate,
            },
          },
        },
      });

      // When
      await handler.execute(
        {
          ficheEvaluationId,
          evaluationsObjectifs: [],
        },
        utilisateurId,
      );

      // Then
      const etape = await prisma.etape_evaluation.findUniqueOrThrow({
        where: { id: etapeEvaluationId },
      });
      expect(etape.updated_at.getTime()).toBeGreaterThan(initialDate.getTime());
    });

    it("doit gérer les notes nulles pour les objectifs", async () => {
      // Given
      const rattachementCode = "REG-203";
      const objectifId = "3bb7d5f4-7f07-44b6-a341-3b7d287dcd85";
      const ficheEvaluationId = "533cf645-f671-4152-a0bb-0404e17636d6";
      const etapeEvaluationId = "375c7b7c-fe14-4542-b4c6-6ad4c5260626";
      const utilisateurId = "41672568-2e78-40bb-9ca8-ed1ea085398b";
      const evaluationObjectifId = "1b9dc0fe-6a00-404c-a0aa-d2f3bcbcfe23";

      await prisma.utilisateur.create({
        data: {
          id: utilisateurId,
          email: "test-objectifs4@example.com",
          nom: "Test4",
          prenom: "User",
          date_creation: new Date(),
          profilCode: "DITP_ADMIN",
        },
      });

      await prisma.referentiel_rattachement.create({
        data: {
          code: rattachementCode,
          groupe: rattachementCode,
          ordre: 1,
          libelle: "Rattachement null objectifs",
          objectifs: {
            create: {
              id: objectifId,
              libelle: "Objectif null",
              descriptif: "Description",
              jalon: 2025,
            },
          },
        },
      });

      await prisma.fiche_evaluation.create({
        data: {
          id: ficheEvaluationId,
          jalon: 2025,
          etape_courante: "AUTO_EVALUATION",
          rattachement_code: rattachementCode,
          etape_evaluations: {
            create: {
              id: etapeEvaluationId,
              type: "AUTO_EVALUATION",
            },
          },
        },
      });

      // When
      await handler.execute(
        {
          ficheEvaluationId,
          evaluationsObjectifs: [
            {
              id: evaluationObjectifId,
              objectifId,
              note: null,
              commentaire: "Pas encore évalué",
              annexe: "une annexe",
            },
          ],
        },
        utilisateurId,
      );

      // Then
      const evaluationObjectif = await prisma.evaluation_objectif.findUnique({
        where: { id: evaluationObjectifId },
      });
      expect(evaluationObjectif).toMatchObject({
        note: null,
        commentaire: "Pas encore évalué",
        annexe: "une annexe",
      });
    });

    it("doit échouer si la fiche n'est pas en étape AUTO_EVALUATION", async () => {
      // Given
      const rattachementCode = "REG-204";
      const ficheEvaluationId = "9f53ee09-f26f-42af-b019-f1f7ac83a874";
      const etapeEvaluationId = "2ec13aee-2b8a-4a60-801f-857591b1afeb";
      const utilisateurId = "230bac45-cedf-4a7f-88ed-a2c430be65d0";

      await prisma.utilisateur.create({
        data: {
          id: utilisateurId,
          email: "test-objectifs5@example.com",
          nom: "Test5",
          prenom: "User",
          date_creation: new Date(),
          profilCode: "DITP_ADMIN",
        },
      });

      await prisma.referentiel_rattachement.create({
        data: {
          code: rattachementCode,
          groupe: rattachementCode,
          ordre: 1,
          libelle: "Rattachement objectifs",
        },
      });

      await prisma.fiche_evaluation.create({
        data: {
          id: ficheEvaluationId,
          jalon: 2025,
          etape_courante: "CONSOLIDATION",
          rattachement_code: rattachementCode,
          etape_evaluations: {
            create: {
              id: etapeEvaluationId,
              type: "AUTO_EVALUATION",
            },
          },
        },
      });

      // When/Then
      await expect(
        handler.execute(
          {
            ficheEvaluationId,
            evaluationsObjectifs: [],
          },
          utilisateurId,
        ),
      ).rejects.toThrow();
    });
  });
});
