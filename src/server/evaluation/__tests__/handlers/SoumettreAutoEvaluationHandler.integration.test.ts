import { SoumettreAutoEvaluationHandler } from "@/server/evaluation/handlers/SoumettreAutoEvaluationHandler";
import { PrismaPilote } from "@/server/db/PrismaPilote";
import { prisma } from "@/server/db/prisma";
import { PrismaTransaction } from "@/server/db/PrismaTransaction";

describe("SoumettreAutoEvaluationHandler", () => {
  let handler: SoumettreAutoEvaluationHandler;
  const prismaPilote = new PrismaPilote();
  const transaction = new PrismaTransaction();

  beforeEach(() => {
    handler = new SoumettreAutoEvaluationHandler({
      prisma: prismaPilote,
      transaction,
    });
  });

  describe("execute", () => {
    it("doit échouer si la fiche n'est pas en étape AUTO_EVALUATION", async () => {
      // Given
      const rattachementCode = "REG-200";
      const ficheEvaluationId = "a27857c4-7c63-4eae-9241-a9353a629f68";
      const utilisateurId = "cd9a7456-7f04-4efd-a070-e9f23eca2504";

      await prisma.utilisateur.create({
        data: {
          id: utilisateurId,
          email: "test.soumettre1@example.com",
          nom: "Soumettre",
          prenom: "Test1",
          date_creation: new Date(),
          profilCode: "DITP_ADMIN",
        },
      });

      await prisma.referentiel_rattachement.create({
        data: {
          code: rattachementCode,
          libelle: "Rattachement soumettre test",
        },
      });

      await prisma.fiche_evaluation.create({
        data: {
          id: ficheEvaluationId,
          jalon: 2025,
          etape_courante: "CONSOLIDATION", // Déjà en consolidation
          rattachement_code: rattachementCode,
          etape_evaluations: {
            create: {
              id: "10dc06b1-8be0-40eb-8cd8-075af37eccbb",
              type: "AUTO_EVALUATION",
            },
          },
        },
      });

      // When/Then
      await expect(
        handler.execute({ ficheEvaluationId }, utilisateurId),
      ).rejects.toThrow();
    });

    it("doit mettre à jour etape_courante vers CONSOLIDATION", async () => {
      // Given
      const rattachementCode = "REG-201";
      const ficheEvaluationId = "a864e699-c04c-4087-8d5b-8a19e7d7fac9";
      const etapeEvaluationId = "af152950-37b7-4f72-84c0-dbd7389c6672";
      const utilisateurId = "91992b88-f8d5-4c38-b00a-9d2a0c3fa639";

      await prisma.utilisateur.create({
        data: {
          id: utilisateurId,
          email: "test.soumettre2@example.com",
          nom: "Soumettre",
          prenom: "Test2",
          date_creation: new Date(),
          profilCode: "DITP_ADMIN",
        },
      });

      await prisma.referentiel_rattachement.create({
        data: {
          code: rattachementCode,
          libelle: "Rattachement soumettre",
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
      await handler.execute({ ficheEvaluationId }, utilisateurId);

      // Then
      const ficheEvaluation = await prisma.fiche_evaluation.findUniqueOrThrow({
        where: { id: ficheEvaluationId },
      });

      expect(ficheEvaluation.etape_courante).toBe("CONSOLIDATION");
    });

    it("doit créer une étape CONSOLIDATION avec les évaluations clonées", async () => {
      // Given
      const rattachementCode = "REG-202";
      const ficheEvaluationId = "d2c9de73-6465-4982-88b3-b50b72dd8cdd";
      const etapeAutoEvaluationId = "37445d15-8c44-4c32-874c-1f9acfc812c0";
      const utilisateurId = "c56ae196-b682-4041-8d2d-e1df80ab2a7f";
      const nouvelAuteurId = "c13658e7-218d-4eee-a435-c75b5c5fcda7";
      const objectifId = "7f49674d-f5d8-4f15-a14c-27af5a30e369";
      const critereId = "b14de9a4-8560-4dfe-87db-d809f8dd4ccb";
      const sousCritereId = "281faaec-39a7-4ab3-ba9f-a89505491bb4";
      const evaluationObjectifId = "8dcbbe35-9ba9-44f4-a529-e184345e1e2f";
      const evaluationCritereId = "660e6500-c52a-4692-a00c-f00df6eae92c";

      await prisma.utilisateur.createMany({
        data: [
          {
            id: utilisateurId,
            email: "test.soumettre3@example.com",
            nom: "Soumettre",
            prenom: "Test3",
            date_creation: new Date(),
            profilCode: "DITP_ADMIN",
          },
          {
            id: nouvelAuteurId,
            email: "test.soumettre3b@example.com",
            nom: "Soumettre",
            prenom: "Test3b",
            date_creation: new Date(),
            profilCode: "DITP_ADMIN",
          },
        ],
      });

      await prisma.referentiel_critere.create({
        data: {
          id: critereId,
          libelle: "Critère clone",
          descriptif: "Description",
          sous_criteres: {
            create: {
              id: sousCritereId,
              libelle: "Sous-critère clone",
              descriptif: "Description",
            },
          },
        },
      });

      await prisma.referentiel_rattachement.create({
        data: {
          code: rattachementCode,
          libelle: "Rattachement clone",
          objectifs: {
            create: {
              id: objectifId,
              libelle: "Objectif clone",
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
                  note: 5,
                  commentaire: "Excellent objectif",
                },
              },
              evaluations_criteres: {
                create: {
                  id: evaluationCritereId,
                  critere_id: critereId,
                  auteur_id: utilisateurId,
                  note: 4,
                  commentaire: "Bon critère",
                },
              },
            },
          },
        },
      });

      // When
      await handler.execute({ ficheEvaluationId }, nouvelAuteurId);

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
          note: 5,
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
          note: 4,
          commentaire: "",
        }),
      ]);
      expect(etapeConsolidation.evaluations_criteres.at(0)?.id).not.toBe(
        evaluationCritereId,
      );
    });
  });
});
