import { EnregistrerBrouillonInstructionHandler } from "@/server/evaluation/handlers/EnregistrerBrouillonInstructionHandler";
import { PrismaPilote } from "@/server/db/PrismaPilote";
import { prisma } from "@/server/db/prisma";
import { PrismaTransaction } from "@/server/db/PrismaTransaction";

describe("EnregistrerBrouillonInstructionHandler", () => {
  let handler: EnregistrerBrouillonInstructionHandler;
  const prismaPilote = new PrismaPilote();
  const transaction = new PrismaTransaction();

  beforeEach(() => {
    handler = new EnregistrerBrouillonInstructionHandler({
      prisma: prismaPilote,
      transaction,
    });
  });

  describe("execute", () => {
    it("doit créer de nouvelles évaluations quand aucune n'existe", async () => {
      // Given
      const critereId = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";
      const sousCritereId = "b2c3d4e5-f6a7-8901-bcde-f12345678901";
      const rattachementCode = "REG-200";
      const objectifId = "c3d4e5f6-a7b8-9012-cdef-123456789012";
      const ficheEvaluationId = "d4e5f6a7-b8c9-0123-def1-234567890123";
      const etapeEvaluationId = "e5f6a7b8-c9d0-1234-ef12-345678901234";
      const utilisateurId = "f6a7b8c9-d0e1-2345-f123-456789012345";
      const evaluationObjectifId = "a7b8c9d0-e1f2-3456-1234-567890123456";
      const evaluationCritereId = "b8c9d0e1-f2a3-4567-2345-678901234567";

      await prisma.utilisateur.create({
        data: {
          id: utilisateurId,
          email: "test@example.com",
          nom: "Test",
          prenom: "User",
          date_creation: new Date(),
          profilCode: "DITP_ADMIN",
        },
      });

      await prisma.referentiel_critere.create({
        data: {
          id: critereId,
          libelle: "Critère test",
          descriptif: "Description",
          sous_criteres: {
            create: {
              id: sousCritereId,
              libelle: "Sous-critère test",
              descriptif: "Description",
            },
          },
        },
      });

      await prisma.referentiel_rattachement.create({
        data: {
          code: rattachementCode,
          groupe: rattachementCode,
          ordre: 1,
          libelle: "Rattachement test",
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
          etape_courante: "INSTRUCTION",
          rattachement_code: rattachementCode,
          etape_evaluations: {
            create: {
              id: etapeEvaluationId,
              type: "INSTRUCTION",
            },
          },
        },
      });

      // When
      await handler.execute(
        [
          {
            ficheEvaluationId,
            evaluationsObjectifs: [
              {
                id: evaluationObjectifId,
                objectifId,
                note: 4,
                commentaire: "Bon objectif",
              },
            ],
            evaluationsCriteres: [
              {
                id: evaluationCritereId,
                critereId,
                note: 3,
                commentaire: "Acceptable",
              },
            ],
          },
        ],
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
      });

      const evaluationCritere = await prisma.evaluation_critere.findUnique({
        where: { id: evaluationCritereId },
      });
      expect(evaluationCritere).toMatchObject({
        id: evaluationCritereId,
        etape_evaluation_id: etapeEvaluationId,
        critere_id: critereId,
        auteur_id: utilisateurId,
        note: 3,
        commentaire: "Acceptable",
      });
    });

    it("doit mettre à jour des évaluations existantes", async () => {
      // Given
      const critereId = "2ead6d59-4205-4fec-9307-5c4016e12694";
      const sousCritereId = "3de685aa-9a75-43d9-b6ec-109c4ff84338";
      const rattachementCode = "REG-201";
      const objectifId = "9cad0c79-9c7a-4e4e-b386-210e467cdb78";
      const ficheEvaluationId = "0551e912-668a-4623-8351-7ceff6fd2a77";
      const etapeEvaluationId = "64f04ba8-85bf-4ba0-be83-b42e8dd5a5e0";
      const utilisateurId = "c647fa2f-c8e2-4a6b-b347-62abf24ff3d2";
      const evaluationObjectifId = "9d8b66e1-1378-4982-9b9e-947b2b4c520b";
      const evaluationCritereId = "48c9c8f1-43dd-4718-87a6-ba9986468c54";

      await prisma.utilisateur.create({
        data: {
          id: utilisateurId,
          email: "test2@example.com",
          nom: "Test2",
          prenom: "User",
          date_creation: new Date(),
          profilCode: "DITP_ADMIN",
        },
      });

      await prisma.referentiel_critere.create({
        data: {
          id: critereId,
          libelle: "Critère update",
          descriptif: "Description",
          sous_criteres: {
            create: {
              id: sousCritereId,
              libelle: "Sous-critère update",
              descriptif: "Description",
            },
          },
        },
      });

      await prisma.referentiel_rattachement.create({
        data: {
          code: rattachementCode,
          groupe: rattachementCode,
          ordre: 1,
          libelle: "Rattachement update",
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
          etape_courante: "INSTRUCTION",
          rattachement_code: rattachementCode,
          etape_evaluations: {
            create: {
              id: etapeEvaluationId,
              type: "INSTRUCTION",
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

      await prisma.evaluation_critere.create({
        data: {
          id: evaluationCritereId,
          etape_evaluation_id: etapeEvaluationId,
          critere_id: critereId,
          auteur_id: utilisateurId,
          note: 1,
          commentaire: "Initial critère",
        },
      });

      // When
      await handler.execute(
        [
          {
            ficheEvaluationId,
            evaluationsObjectifs: [
              {
                id: evaluationObjectifId,
                objectifId,
                note: 5,
                commentaire: "Updated comment",
              },
            ],
            evaluationsCriteres: [
              {
                id: evaluationCritereId,
                critereId,
                note: 4,
                commentaire: "Updated critère",
              },
            ],
          },
        ],
        utilisateurId,
      );

      // Then
      const evaluationObjectif = await prisma.evaluation_objectif.findUnique({
        where: { id: evaluationObjectifId },
      });
      expect(evaluationObjectif).toMatchObject({
        note: 5,
        commentaire: "Updated comment",
      });

      const evaluationCritere = await prisma.evaluation_critere.findUnique({
        where: { id: evaluationCritereId },
      });
      expect(evaluationCritere).toMatchObject({
        note: 4,
        commentaire: "Updated critère",
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
          email: "test3@example.com",
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
          libelle: "Rattachement date",
        },
      });

      const initialDate = new Date("2025-01-01T00:00:00Z");
      await prisma.fiche_evaluation.create({
        data: {
          id: ficheEvaluationId,
          jalon: 2025,
          etape_courante: "INSTRUCTION",
          rattachement_code: rattachementCode,
          etape_evaluations: {
            create: {
              id: etapeEvaluationId,
              type: "INSTRUCTION",
              updated_at: initialDate,
            },
          },
        },
      });

      // When
      await handler.execute(
        [
          {
            ficheEvaluationId,
            evaluationsObjectifs: [],
            evaluationsCriteres: [],
          },
        ],
        utilisateurId,
      );

      // Then
      const etape = await prisma.etape_evaluation.findUniqueOrThrow({
        where: { id: etapeEvaluationId },
      });
      expect(etape.updated_at.getTime()).toBeGreaterThan(initialDate.getTime());
    });

    it("doit gérer les notes nulles", async () => {
      // Given
      const critereId = "a6c9897c-7d0e-4e9c-af8a-54e42f0a1d8e";
      const sousCritereId = "46a3fa1a-2c3f-4554-9240-cbbe1614075e";
      const rattachementCode = "REG-203";
      const objectifId = "3bb7d5f4-7f07-44b6-a341-3b7d287dcd85";
      const ficheEvaluationId = "533cf645-f671-4152-a0bb-0404e17636d6";
      const etapeEvaluationId = "375c7b7c-fe14-4542-b4c6-6ad4c5260626";
      const utilisateurId = "41672568-2e78-40bb-9ca8-ed1ea085398b";
      const evaluationObjectifId = "1b9dc0fe-6a00-404c-a0aa-d2f3bcbcfe23";
      const evaluationCritereId = "f061f13f-b742-4828-b3e4-3b8aa8341f27";

      await prisma.utilisateur.create({
        data: {
          id: utilisateurId,
          email: "test4@example.com",
          nom: "Test4",
          prenom: "User",
          date_creation: new Date(),
          profilCode: "DITP_ADMIN",
        },
      });

      await prisma.referentiel_critere.create({
        data: {
          id: critereId,
          libelle: "Critère null",
          descriptif: "Description",
          sous_criteres: {
            create: {
              id: sousCritereId,
              libelle: "Sous-critère null",
              descriptif: "Description",
            },
          },
        },
      });

      await prisma.referentiel_rattachement.create({
        data: {
          code: rattachementCode,
          groupe: rattachementCode,
          ordre: 1,
          libelle: "Rattachement null",
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
          etape_courante: "INSTRUCTION",
          rattachement_code: rattachementCode,
          etape_evaluations: {
            create: {
              id: etapeEvaluationId,
              type: "INSTRUCTION",
            },
          },
        },
      });

      // When
      await handler.execute(
        [
          {
            ficheEvaluationId,
            evaluationsObjectifs: [
              {
                id: evaluationObjectifId,
                objectifId,
                note: null,
                commentaire: "Pas encore évalué",
              },
            ],
            evaluationsCriteres: [
              {
                id: evaluationCritereId,
                critereId,
                note: null,
                commentaire: "En cours",
              },
            ],
          },
        ],
        utilisateurId,
      );

      // Then
      const evaluationObjectif = await prisma.evaluation_objectif.findUnique({
        where: { id: evaluationObjectifId },
      });
      expect(evaluationObjectif).toMatchObject({
        note: null,
        commentaire: "Pas encore évalué",
      });

      const evaluationCritere = await prisma.evaluation_critere.findUnique({
        where: { id: evaluationCritereId },
      });
      expect(evaluationCritere).toMatchObject({
        note: null,
        commentaire: "En cours",
      });
    });

    it("doit échouer si la fiche n'est pas en étape INSTRUCTION", async () => {
      // Given
      const rattachementCode = "REG-204";
      const ficheEvaluationId = "9f53ee09-f26f-42af-b019-f1f7ac83a874";
      const etapeEvaluationId = "2ec13aee-2b8a-4a60-801f-857591b1afeb";
      const utilisateurId = "230bac45-cedf-4a7f-88ed-a2c430be65d0";

      await prisma.utilisateur.create({
        data: {
          id: utilisateurId,
          email: "test5@example.com",
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
          libelle: "Rattachement",
        },
      });

      await prisma.fiche_evaluation.create({
        data: {
          id: ficheEvaluationId,
          jalon: 2025,
          etape_courante: "CONSOLIDATION", // Etape différente
          rattachement_code: rattachementCode,
          etape_evaluations: {
            create: {
              id: etapeEvaluationId,
              type: "INSTRUCTION",
            },
          },
        },
      });

      // When/Then
      await expect(
        handler.execute(
          [
            {
              ficheEvaluationId,
              evaluationsObjectifs: [],
              evaluationsCriteres: [],
            },
          ],
          utilisateurId,
        ),
      ).rejects.toThrow();
    });
  });
});
