import { RetournerAutoEvaluationHandler } from "@/server/evaluation/handlers/RetournerAutoEvaluationHandler";
import { PrismaPilote } from "@/server/db/PrismaPilote";
import { InMemoryTransaction } from "@/server/db/InMemoryTransaction";
import { createIntegrationTest } from "@/server/infrastructure/test/createIntegrationTest";
import { fixtures } from "@/server/infrastructure/test/fixtures";

describe("RetournerAutoEvaluationHandler", () => {
  let handler: RetournerAutoEvaluationHandler;
  const prismaPilote = new PrismaPilote();
  const transaction = new InMemoryTransaction();

  beforeEach(() => {
    handler = new RetournerAutoEvaluationHandler({
      transaction,
      prisma: prismaPilote,
    });
  });

  describe("#execute", () => {
    it(
      "doit échouer si une fiche n'est pas en étape CONSOLIDATION",
      createIntegrationTest(async () => {
        // Given
        const fiche = await fixtures.fiche({
          etape_courante: "AUTO_EVALUATION",
        });

        // When/Then
        await expect(
          handler.execute({
            ficheEvaluationIds: [fiche.id],
          }),
        ).rejects.toThrow(
          "Toutes les fiches doivent être en étape CONSOLIDATION pour retourner à l'auto-évaluation",
        );
      }),
    );

    it(
      "doit échouer si une fiche parmi plusieurs n'est pas en étape CONSOLIDATION",
      createIntegrationTest(async () => {
        // Given
        const fiche1 = await fixtures.fiche({
          etape_courante: "CONSOLIDATION",
        });
        const fiche2 = await fixtures.fiche({
          etape_courante: "INSTRUCTION",
        });

        // When/Then
        await expect(
          handler.execute({
            ficheEvaluationIds: [fiche1.id, fiche2.id],
          }),
        ).rejects.toThrow(
          "Toutes les fiches doivent être en étape CONSOLIDATION pour retourner à l'auto-évaluation",
        );
      }),
    );

    it(
      "doit mettre à jour l'étape courante vers AUTO_EVALUATION",
      createIntegrationTest(async (tx) => {
        // Given
        const fiche = await fixtures.fiche({
          etape_courante: "CONSOLIDATION",
        });

        await fixtures.etapeEvaluation({
          fiche_evaluation_id: fiche.id,
          type: "AUTO_EVALUATION",
        });
        await fixtures.etapeEvaluation({
          fiche_evaluation_id: fiche.id,
          type: "CONSOLIDATION",
        });

        // When
        await handler.execute({
          ficheEvaluationIds: [fiche.id],
        });

        // Then
        const ficheEvaluation = await tx.fiche_evaluation.findUniqueOrThrow({
          where: { id: fiche.id },
        });
        expect(ficheEvaluation.etape_courante).toBe("AUTO_EVALUATION");
      }),
    );

    it(
      "doit remettre l'étape AUTO_EVALUATION en écriture",
      createIntegrationTest(async (tx) => {
        // Given
        const fiche = await fixtures.fiche({
          etape_courante: "CONSOLIDATION",
        });

        const etapeAutoEvaluation = await fixtures.etapeEvaluation({
          fiche_evaluation_id: fiche.id,
          type: "AUTO_EVALUATION",
          read_only: true,
          objectifs_valides: true,
          criteres_valides: true,
        });

        await fixtures.etapeEvaluation({
          fiche_evaluation_id: fiche.id,
          type: "CONSOLIDATION",
        });

        // When
        await handler.execute({
          ficheEvaluationIds: [fiche.id],
        });

        // Then
        const etapeUpdated = await tx.etape_evaluation.findUniqueOrThrow({
          where: { id: etapeAutoEvaluation.id },
        });

        expect(etapeUpdated).toEqual(
          expect.objectContaining({
            read_only: false,
            objectifs_valides: false,
            criteres_valides: false,
          }),
        );
      }),
    );
  });
});
