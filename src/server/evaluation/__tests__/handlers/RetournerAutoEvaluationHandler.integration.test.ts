import { RetournerAutoEvaluationHandler } from "@/server/evaluation/handlers/RetournerAutoEvaluationHandler";
import { PrismaPilote } from "@/server/db/PrismaPilote";
import { prisma } from "@/server/db/prisma";
import { PrismaTransaction } from "@/server/db/PrismaTransaction";

describe("RetournerAutoEvaluationHandler", () => {
  let handler: RetournerAutoEvaluationHandler;
  const prismaPilote = new PrismaPilote();
  const transaction = new PrismaTransaction();

  beforeEach(() => {
    handler = new RetournerAutoEvaluationHandler({
      transaction,
      prisma: prismaPilote,
    });
  });

  describe("#execute", () => {
    it("doit échouer si une fiche n'est pas en étape CONSOLIDATION", async () => {
      // Given
      const rattachementCode = "REG-600";
      const ficheEvaluationId = "a1b2c3d4-5e6f-7a8b-9c0d-1e2f3a4b5c6e";

      await prisma.referentiel_rattachement.create({
        data: {
          code: rattachementCode,
          groupe: rattachementCode,
          ordre: 1,
          libelle: "Rattachement retour auto-eval test",
        },
      });

      await prisma.fiche_evaluation.create({
        data: {
          id: ficheEvaluationId,
          jalon: 2025,
          etape_courante: "AUTO_EVALUATION",
          rattachement_code: rattachementCode,
        },
      });

      // When/Then
      await expect(
        handler.execute({
          ficheEvaluationIds: [ficheEvaluationId],
        }),
      ).rejects.toThrow(
        "Toutes les fiches doivent être en étape CONSOLIDATION pour retourner à l'auto-évaluation",
      );
    });

    it("doit échouer si une fiche parmi plusieurs n'est pas en étape CONSOLIDATION", async () => {
      // Given
      const rattachementCode1 = "REG-601";
      const rattachementCode2 = "REG-602";
      const ficheEvaluationId1 = "b2c3d4e5-6f7a-8b9c-0d1e-2f3a4b5c6d7f";
      const ficheEvaluationId2 = "8835d5de-b194-481d-b427-3fbcc837c550";

      await prisma.referentiel_rattachement.createMany({
        data: [
          {
            code: rattachementCode1,
            groupe: rattachementCode1,
            ordre: 1,
            libelle: "Rattachement retour test 1",
          },
          {
            code: rattachementCode2,
            groupe: rattachementCode2,
            ordre: 1,
            libelle: "Rattachement retour test 2",
          },
        ],
      });

      await prisma.fiche_evaluation.createMany({
        data: [
          {
            id: ficheEvaluationId1,
            jalon: 2025,
            etape_courante: "CONSOLIDATION",
            rattachement_code: rattachementCode1,
          },
          {
            id: ficheEvaluationId2,
            jalon: 2025,
            etape_courante: "INSTRUCTION",
            rattachement_code: rattachementCode2,
          },
        ],
      });

      // When/Then
      await expect(
        handler.execute({
          ficheEvaluationIds: [ficheEvaluationId1, ficheEvaluationId2],
        }),
      ).rejects.toThrow(
        "Toutes les fiches doivent être en étape CONSOLIDATION pour retourner à l'auto-évaluation",
      );
    });

    it("doit mettre à jour l'étape courante vers AUTO_EVALUATION", async () => {
      // Given
      const rattachementCode = "REG-603";
      const ficheEvaluationId = "0773b227-797d-4555-891b-6c7ea455aa36";

      await prisma.referentiel_rattachement.create({
        data: {
          code: rattachementCode,
          groupe: rattachementCode,
          ordre: 1,
          libelle: "Rattachement retour succès",
        },
      });

      await prisma.fiche_evaluation.create({
        data: {
          id: ficheEvaluationId,
          jalon: 2025,
          etape_courante: "CONSOLIDATION",
          rattachement_code: rattachementCode,
          etape_evaluations: {
            create: [
              {
                id: "f86111b7-1ee5-48fd-9f88-48c845ce95b9",
                type: "AUTO_EVALUATION",
              },
              {
                id: "46013437-2043-4e3c-9bf2-3f4219d81fe8",
                type: "CONSOLIDATION",
              },
            ],
          },
        },
      });

      // When
      await handler.execute({
        ficheEvaluationIds: [ficheEvaluationId],
      });

      // Then
      const ficheEvaluation = await prisma.fiche_evaluation.findUniqueOrThrow({
        where: { id: ficheEvaluationId },
      });
      expect(ficheEvaluation.etape_courante).toBe("AUTO_EVALUATION");
    });
  });
});
