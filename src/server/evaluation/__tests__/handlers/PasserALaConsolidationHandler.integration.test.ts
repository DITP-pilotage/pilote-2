import { PasserALaConsolidationHandler } from "@/server/evaluation/handlers/PasserALaConsolidationHandler";
import { PrismaPilote } from "@/server/db/PrismaPilote";
import { prisma } from "@/server/db/prisma";
import { PrismaTransaction } from "@/server/db/PrismaTransaction";
import { SoumettreAutoEvaluationService } from "@/server/evaluation/services/SoumettreAutoEvaluationService";

describe("PasserALaConsolidationHandler", () => {
  let handler: PasserALaConsolidationHandler;
  const prismaPilote = new PrismaPilote();
  const transaction = new PrismaTransaction();
  const soumettreAutoEvaluationService = new SoumettreAutoEvaluationService({
    transaction,
    prisma: prismaPilote,
  });

  beforeEach(() => {
    handler = new PasserALaConsolidationHandler({
      transaction,
      soumettreAutoEvaluationService,
    });
  });

  describe("#execute", () => {
    it("doit échouer si la fiche n'est pas en étape AUTO_EVALUATION", async () => {
      // Given
      const rattachementCode = "REG-500";
      const ficheEvaluationId = "a1b2c3d4-5e6f-7a8b-9c0d-1e2f3a4b5c6d";
      const utilisateurId = "b2c3d4e5-6f7a-8b9c-0d1e-2f3a4b5c6d7e";

      await prisma.utilisateur.create({
        data: {
          id: utilisateurId,
          email: "test.consolidation1@example.com",
          nom: "Consolidation",
          prenom: "Test1",
          date_creation: new Date(),
          profilCode: "DITP_ADMIN",
        },
      });

      await prisma.referentiel_rattachement.create({
        data: {
          code: rattachementCode,
          groupe: rattachementCode,
          ordre: 1,
          libelle: "Rattachement consolidation test",
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
              id: "c3d4e5f6-7a8b-9c0d-1e2f-3a4b5c6d7e8f",
              type: "AUTO_EVALUATION",
            },
          },
        },
      });

      // When/Then
      await expect(
        handler.execute(
          { ficheEvaluationIds: [ficheEvaluationId] },
          utilisateurId,
        ),
      ).rejects.toThrow();
    });

    it("doit créer une étape CONSOLIDATION avec les évaluations clonées sans les commentaires", async () => {
      // Given
      const rattachementCode = "REG-501";
      const ficheEvaluationId = "d4e5f6a7-8b9c-0d1e-2f3a-4b5c6d7e8f9a";
      const etapeAutoEvaluationId = "e5f6a7b8-9c0d-1e2f-3a4b-5c6d7e8f9a0b";
      const utilisateurId = "f6a7b8c9-0d1e-2f3a-4b5c-6d7e8f9a0b1c";
      const nouvelAuteurId = "a7b8c9d0-1e2f-3a4b-5c6d-7e8f9a0b1c2d";
      const objectifId = "b8c9d0e1-2f3a-4b5c-6d7e-8f9a0b1c2d3e";
      const critereId = "c9d0e1f2-3a4b-5c6d-7e8f-9a0b1c2d3e4f";
      const sousCritereId = "d0e1f2a3-4b5c-6d7e-8f9a-0b1c2d3e4f5a";
      const evaluationObjectifId = "e1f2a3b4-5c6d-7e8f-9a0b-1c2d3e4f5a6b";
      const evaluationCritereId = "f2a3b4c5-6d7e-8f9a-0b1c-2d3e4f5a6b7c";

      await prisma.utilisateur.createMany({
        data: [
          {
            id: utilisateurId,
            email: "test.consolidation2@example.com",
            nom: "Consolidation",
            prenom: "Test2",
            date_creation: new Date(),
            profilCode: "DITP_ADMIN",
          },
          {
            id: nouvelAuteurId,
            email: "test.consolidation2b@example.com",
            nom: "Consolidation",
            prenom: "Test2b",
            date_creation: new Date(),
            profilCode: "DITP_ADMIN",
          },
        ],
      });

      await prisma.referentiel_critere.create({
        data: {
          id: critereId,
          libelle: "Critère consolidation",
          descriptif: "Description",
          sous_criteres: {
            create: {
              id: sousCritereId,
              libelle: "Sous-critère consolidation",
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
          libelle: "Rattachement consolidation clone",
          objectifs: {
            create: {
              id: objectifId,
              libelle: "Objectif consolidation",
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
              id: etapeAutoEvaluationId,
              type: "AUTO_EVALUATION",
              evaluations_objectifs: {
                create: {
                  id: evaluationObjectifId,
                  objectif_id: objectifId,
                  auteur_id: utilisateurId,
                  note: 4,
                  commentaire: "Objectif auto-évalué",
                },
              },
              evaluations_criteres: {
                create: {
                  id: evaluationCritereId,
                  critere_id: critereId,
                  auteur_id: utilisateurId,
                  note: 3,
                  commentaire: "Critère auto-évalué",
                },
              },
            },
          },
        },
      });

      // When
      await handler.execute(
        { ficheEvaluationIds: [ficheEvaluationId] },
        nouvelAuteurId,
      );

      // Then
      const etapeConsolidation = await prisma.etape_evaluation.findFirstOrThrow(
        {
          where: {
            fiche_evaluation_id: ficheEvaluationId,
            type: "CONSOLIDATION",
          },
          include: {
            evaluations_objectifs: true,
            evaluations_criteres: true,
          },
        },
      );

      expect(etapeConsolidation.evaluations_objectifs).toEqual([
        expect.objectContaining({
          objectif_id: objectifId,
          auteur_id: nouvelAuteurId,
          note: 4,
          commentaire: "",
        }),
      ]);
      expect(etapeConsolidation.evaluations_objectifs.at(0)?.id).not.toBe(
        evaluationObjectifId,
      );

      expect(etapeConsolidation.evaluations_criteres).toEqual([
        expect.objectContaining({
          critere_id: critereId,
          auteur_id: nouvelAuteurId,
          note: 3,
          commentaire: "",
        }),
      ]);
      expect(etapeConsolidation.evaluations_criteres.at(0)?.id).not.toBe(
        evaluationCritereId,
      );

      const ficheEvaluation = await prisma.fiche_evaluation.findUniqueOrThrow({
        where: { id: ficheEvaluationId },
      });
      expect(ficheEvaluation.etape_courante).toBe("CONSOLIDATION");
    });

    it("doit traiter plusieurs fiches en une seule transaction", async () => {
      // Given
      const rattachementCode = "REG-502";
      const rattachementCode2 = "REG-503";
      const ficheEvaluationId1 = "a3b4c5d6-7e8f-9a0b-1c2d-3e4f5a6b7c8d";
      const ficheEvaluationId2 = "b4c5d6e7-8f9a-0b1c-2d3e-4f5a6b7c8d9e";
      const etapeAutoEvaluationId1 = "c5d6e7f8-9a0b-1c2d-3e4f-5a6b7c8d9e0f";
      const etapeAutoEvaluationId2 = "d6e7f8a9-0b1c-2d3e-4f5a-6b7c8d9e0f1a";
      const utilisateurId = "e7f8a9b0-1c2d-3e4f-5a6b-7c8d9e0f1a2b";

      await prisma.utilisateur.create({
        data: {
          id: utilisateurId,
          email: "test.consolidation3@example.com",
          nom: "Consolidation",
          prenom: "Test3",
          date_creation: new Date(),
          profilCode: "DITP_ADMIN",
        },
      });

      await prisma.referentiel_rattachement.create({
        data: {
          code: rattachementCode,
          groupe: rattachementCode,
          ordre: 1,
          libelle: "Rattachement consolidation multiple",
        },
      });

      await prisma.referentiel_rattachement.create({
        data: {
          code: rattachementCode2,
          groupe: rattachementCode2,
          ordre: 1,
          libelle: "Rattachement consolidation multiple 2",
        },
      });

      await prisma.fiche_evaluation.createMany({
        data: [
          {
            id: ficheEvaluationId1,
            jalon: 2025,
            etape_courante: "AUTO_EVALUATION",
            rattachement_code: rattachementCode,
          },
          {
            id: ficheEvaluationId2,
            jalon: 2025,
            etape_courante: "AUTO_EVALUATION",
            rattachement_code: rattachementCode2,
          },
        ],
      });

      await prisma.etape_evaluation.createMany({
        data: [
          {
            id: etapeAutoEvaluationId1,
            type: "AUTO_EVALUATION",
            fiche_evaluation_id: ficheEvaluationId1,
          },
          {
            id: etapeAutoEvaluationId2,
            type: "AUTO_EVALUATION",
            fiche_evaluation_id: ficheEvaluationId2,
          },
        ],
      });

      // When
      await handler.execute(
        { ficheEvaluationIds: [ficheEvaluationId1, ficheEvaluationId2] },
        utilisateurId,
      );

      // Then
      const fichesEvaluation = await prisma.fiche_evaluation.findMany({
        where: { id: { in: [ficheEvaluationId1, ficheEvaluationId2] } },
      });

      expect(fichesEvaluation).toHaveLength(2);
      expect(
        fichesEvaluation.every(
          (fiche) => fiche.etape_courante === "CONSOLIDATION",
        ),
      ).toBe(true);

      const etapesConsolidation = await prisma.etape_evaluation.findMany({
        where: {
          fiche_evaluation_id: { in: [ficheEvaluationId1, ficheEvaluationId2] },
          type: "CONSOLIDATION",
        },
      });

      expect(etapesConsolidation).toHaveLength(2);
    });
  });
});
