import { RetournerAppreciationHandler } from "@/server/evaluation/handlers/RetournerAppreciationHandler";
import { PrismaPilote } from "@/server/db/PrismaPilote";
import { prisma } from "@/server/db/prisma";
import { PrismaTransaction } from "@/server/db/PrismaTransaction";

describe("RetournerAppreciationHandler", () => {
  let handler: RetournerAppreciationHandler;
  const prismaPilote = new PrismaPilote();
  const transaction = new PrismaTransaction();

  beforeEach(() => {
    handler = new RetournerAppreciationHandler({
      transaction,
      prisma: prismaPilote,
    });
  });

  describe("#execute", () => {
    it("doit échouer si une fiche n'est pas en étape INSTRUCTION", async () => {
      // Given
      const rattachementCode = "REG-700";
      const ficheEvaluationId = "d1e2f3a4-5b6c-7d8e-9f0a-1b2c3d4e5f6a";

      await prisma.referentiel_rattachement.create({
        data: {
          code: rattachementCode,
          groupe: rattachementCode,
          ordre: 1,
          libelle: "Rattachement retour appréciation test",
        },
      });

      await prisma.fiche_evaluation.create({
        data: {
          id: ficheEvaluationId,
          jalon: 2025,
          etape_courante: "CONSOLIDATION",
          rattachement_code: rattachementCode,
        },
      });

      // When/Then
      await expect(
        handler.execute({
          ficheEvaluationIds: [ficheEvaluationId],
        }),
      ).rejects.toThrow(
        "Toutes les fiches doivent être en étape INSTRUCTION pour retourner à l'appréciation",
      );
    });

    it("doit échouer si une fiche parmi plusieurs n'est pas en étape INSTRUCTION", async () => {
      // Given
      const rattachementCode1 = "REG-701";
      const rattachementCode2 = "REG-702";
      const ficheEvaluationId1 = "e2f3a4b5-6c7d-8e9f-0a1b-2c3d4e5f6a7b";
      const ficheEvaluationId2 = "f3a4b5c6-7d8e-9f0a-1b2c-3d4e5f6a7b8c";

      await prisma.referentiel_rattachement.createMany({
        data: [
          {
            code: rattachementCode1,
            groupe: rattachementCode1,
            ordre: 1,
            libelle: "Rattachement retour appréciation test 1",
          },
          {
            code: rattachementCode2,
            groupe: rattachementCode2,
            ordre: 1,
            libelle: "Rattachement retour appréciation test 2",
          },
        ],
      });

      await prisma.fiche_evaluation.createMany({
        data: [
          {
            id: ficheEvaluationId1,
            jalon: 2025,
            etape_courante: "INSTRUCTION",
            rattachement_code: rattachementCode1,
          },
          {
            id: ficheEvaluationId2,
            jalon: 2025,
            etape_courante: "CONSOLIDATION",
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
        "Toutes les fiches doivent être en étape INSTRUCTION pour retourner à l'appréciation",
      );
    });

    it("doit mettre à jour l'étape courante vers CONSOLIDATION", async () => {
      // Given
      const rattachementCode = "REG-703";
      const ficheEvaluationId = "a4b5c6d7-8e9f-0a1b-2c3d-4e5f6a7b8c9d";

      await prisma.referentiel_rattachement.create({
        data: {
          code: rattachementCode,
          groupe: rattachementCode,
          ordre: 1,
          libelle: "Rattachement retour appréciation succès",
        },
      });

      await prisma.fiche_evaluation.create({
        data: {
          id: ficheEvaluationId,
          jalon: 2025,
          etape_courante: "INSTRUCTION",
          rattachement_code: rattachementCode,
          etape_evaluations: {
            create: [
              {
                id: "b5c6d7e8-9f0a-1b2c-3d4e-5f6a7b8c9d0e",
                type: "AUTO_EVALUATION",
              },
              {
                id: "c6d7e8f9-0a1b-2c3d-4e5f-6a7b8c9d0e1f",
                type: "CONSOLIDATION",
              },
              {
                id: "d7e8f9a0-1b2c-3d4e-5f6a-7b8c9d0e1f2a",
                type: "INSTRUCTION",
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
      expect(ficheEvaluation.etape_courante).toBe("CONSOLIDATION");
    });

    it("doit remettre l'étape CONSOLIDATION en écriture", async () => {
      // Given
      const rattachementCode = "REG-704";
      const ficheEvaluationId = "e8f9a0b1-2c3d-4e5f-6a7b-8c9d0e1f2a3b";
      const etapeConsolidationId = "f9a0b1c2-3d4e-5f6a-7b8c-9d0e1f2a3b4c";

      await prisma.referentiel_rattachement.create({
        data: {
          code: rattachementCode,
          groupe: rattachementCode,
          ordre: 1,
          libelle: "Rattachement retour appréciation reset flags",
        },
      });

      await prisma.fiche_evaluation.create({
        data: {
          id: ficheEvaluationId,
          jalon: 2025,
          etape_courante: "INSTRUCTION",
          rattachement_code: rattachementCode,
          etape_evaluations: {
            create: [
              {
                id: "a0b1c2d3-4e5f-6a7b-8c9d-0e1f2a3b4c5d",
                type: "AUTO_EVALUATION",
              },
              {
                id: etapeConsolidationId,
                type: "CONSOLIDATION",
                read_only: true,
                objectifs_valides: true,
                criteres_valides: true,
              },
              {
                id: "b1c2d3e4-5f6a-7b8c-9d0e-1f2a3b4c5d6e",
                type: "INSTRUCTION",
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
      const etapeConsolidation =
        await prisma.etape_evaluation.findUniqueOrThrow({
          where: { id: etapeConsolidationId },
        });

      expect(etapeConsolidation).toEqual(
        expect.objectContaining({
          read_only: false,
          objectifs_valides: false,
          criteres_valides: false,
        }),
      );
    });
  });
});
