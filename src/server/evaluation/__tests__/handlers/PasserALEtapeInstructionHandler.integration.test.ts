import { PasserALEtapeInstructionHandler } from "@/server/evaluation/handlers/PasserALEtapeInstructionHandler";
import { PrismaPilote } from "@/server/db/PrismaPilote";
import { prisma } from "@/server/db/prisma";
import { PrismaTransaction } from "@/server/db/PrismaTransaction";

describe("PasserALEtapeInstructionHandler", () => {
  let handler: PasserALEtapeInstructionHandler;
  const prismaPilote = new PrismaPilote();
  const transaction = new PrismaTransaction();

  beforeEach(() => {
    handler = new PasserALEtapeInstructionHandler({
      prisma: prismaPilote,
      transaction,
    });
  });

  describe("execute", () => {
    it("doit échouer si la fiche n'est pas en étape CONSOLIDATION", async () => {
      // Given
      const rattachementCode = "REG-400";
      const ficheEvaluationId = "e8f9c2d1-4a5b-4d8c-9e2f-1a3b4c5d6e7f";
      const utilisateurId = "f9a0c3d2-5b6c-4e9d-0f3a-2b4c5d6e7f8a";

      await prisma.utilisateur.create({
        data: {
          id: utilisateurId,
          email: "test.instruction1@example.com",
          nom: "Instruction",
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
          libelle: "Rattachement instruction test",
        },
      });

      await prisma.fiche_evaluation.create({
        data: {
          id: ficheEvaluationId,
          jalon: 2025,
          etape_courante: "AUTO_EVALUATION", // Pas en consolidation
          rattachement_code: rattachementCode,
          etape_evaluations: {
            create: {
              id: "a1b2c3d4-5e6f-7a8b-9c0d-1e2f3a4b5c6d",
              type: "CONSOLIDATION",
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

    it("doit créer une étape INSTRUCTION avec les évaluations clonées", async () => {
      // Given
      const rattachementCode = "REG-402";
      const ficheEvaluationId = "e2f3a4b5-9c0d-7e1f-2a3b-5c6d7e8f9a0b";
      const etapeConsolidationId = "f3a4b5c6-0d1e-8f2a-3b4c-6d7e8f9a0b1c";
      const utilisateurId = "a4b5c6d7-1e2f-9a3b-4c5d-7e8f9a0b1c2d";
      const nouvelAuteurId = "b5c6d7e8-2f3a-0b4c-5d6e-8f9a0b1c2d3e";
      const objectifId = "c6d7e8f9-3a4b-1c5d-6e7f-9a0b1c2d3e4f";
      const critereId = "d7e8f9a0-4b5c-2d6e-7f8a-0b1c2d3e4f5a";
      const sousCritereId = "e8f9a0b1-5c6d-3e7f-8a9b-1c2d3e4f5a6b";
      const evaluationObjectifId = "f9a0b1c2-6d7e-4f8a-9b0c-2d3e4f5a6b7c";
      const evaluationCritereId = "a0b1c2d3-7e8f-5a9b-0c1d-3e4f5a6b7c8d";

      await prisma.utilisateur.createMany({
        data: [
          {
            id: utilisateurId,
            email: "test.instruction3@example.com",
            nom: "Instruction",
            prenom: "Test3",
            date_creation: new Date(),
            profilCode: "DITP_ADMIN",
          },
          {
            id: nouvelAuteurId,
            email: "test.instruction3b@example.com",
            nom: "Instruction",
            prenom: "Test3b",
            date_creation: new Date(),
            profilCode: "DITP_ADMIN",
          },
        ],
      });

      await prisma.referentiel_critere.create({
        data: {
          id: critereId,
          libelle: "Critère instruction",
          descriptif: "Description",
          sous_criteres: {
            create: {
              id: sousCritereId,
              libelle: "Sous-critère instruction",
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
          libelle: "Rattachement instruction clone",
          objectifs: {
            create: {
              id: objectifId,
              libelle: "Objectif instruction",
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
          etape_courante: "CONSOLIDATION",
          rattachement_code: rattachementCode,
          etape_evaluations: {
            create: {
              id: etapeConsolidationId,
              type: "CONSOLIDATION",
              evaluations_objectifs: {
                create: {
                  id: evaluationObjectifId,
                  objectif_id: objectifId,
                  auteur_id: utilisateurId,
                  note: 3,
                  commentaire: "Objectif consolidé",
                },
              },
              evaluations_criteres: {
                create: {
                  id: evaluationCritereId,
                  critere_id: critereId,
                  auteur_id: utilisateurId,
                  note: 2,
                  commentaire: "Critère consolidé",
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
      const etapeInstruction = await prisma.etape_evaluation.findFirstOrThrow({
        where: {
          fiche_evaluation_id: ficheEvaluationId,
          type: "INSTRUCTION",
        },
        include: {
          evaluations_objectifs: true,
          evaluations_criteres: true,
        },
      });

      expect(etapeInstruction.evaluations_objectifs).toEqual([
        expect.objectContaining({
          objectif_id: objectifId,
          auteur_id: nouvelAuteurId,
          note: 3,
          commentaire: "",
        }),
      ]);
      expect(etapeInstruction.evaluations_objectifs.at(0)?.id).not.toBe(
        evaluationObjectifId,
      );

      expect(etapeInstruction.evaluations_criteres).toEqual([
        expect.objectContaining({
          critere_id: critereId,
          auteur_id: nouvelAuteurId,
          note: 2,
          commentaire: "",
        }),
      ]);
      expect(etapeInstruction.evaluations_criteres.at(0)?.id).not.toBe(
        evaluationCritereId,
      );
    });

    it("doit traiter plusieurs fiches en une seule transaction", async () => {
      // Given
      const rattachementCode = "REG-403";
      const rattachementCode2 = "REG-402";
      const ficheEvaluationId1 = "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d";
      const ficheEvaluationId2 = "b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e";
      const etapeConsolidationId1 = "c3d4e5f6-a7b8-9c0d-1e2f-3a4b5c6d7e8f";
      const etapeConsolidationId2 = "d4e5f6a7-b8c9-0d1e-2f3a-4b5c6d7e8f9a";
      const utilisateurId = "e5f6a7b8-c9d0-1e2f-3a4b-5c6d7e8f9a0b";

      await prisma.utilisateur.create({
        data: {
          id: utilisateurId,
          email: "test.instruction4@example.com",
          nom: "Instruction",
          prenom: "Test4",
          date_creation: new Date(),
          profilCode: "DITP_ADMIN",
        },
      });

      await prisma.referentiel_rattachement.create({
        data: {
          code: rattachementCode,
          groupe: rattachementCode,
          ordre: 1,
          libelle: "Rattachement instruction multiple",
        },
      });

      await prisma.referentiel_rattachement.create({
        data: {
          code: rattachementCode2,
          groupe: rattachementCode,
          ordre: 1,
          libelle: "Rattachement instruction multiple 2",
        },
      });

      await prisma.fiche_evaluation.createMany({
        data: [
          {
            id: ficheEvaluationId1,
            jalon: 2025,
            etape_courante: "CONSOLIDATION",
            rattachement_code: rattachementCode,
          },
          {
            id: ficheEvaluationId2,
            jalon: 2025,
            etape_courante: "CONSOLIDATION",
            rattachement_code: rattachementCode2,
          },
        ],
      });

      await prisma.etape_evaluation.createMany({
        data: [
          {
            id: etapeConsolidationId1,
            type: "CONSOLIDATION",
            fiche_evaluation_id: ficheEvaluationId1,
          },
          {
            id: etapeConsolidationId2,
            type: "CONSOLIDATION",
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
          (fiche) => fiche.etape_courante === "INSTRUCTION",
        ),
      ).toBe(true);

      const etapesInstruction = await prisma.etape_evaluation.findMany({
        where: {
          fiche_evaluation_id: { in: [ficheEvaluationId1, ficheEvaluationId2] },
          type: "INSTRUCTION",
        },
      });

      expect(etapesInstruction).toHaveLength(2);
    });
  });
});
