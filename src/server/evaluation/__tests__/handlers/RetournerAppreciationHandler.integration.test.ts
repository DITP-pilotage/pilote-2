import { RetournerAppreciationHandler } from "@/server/evaluation/handlers/RetournerAppreciationHandler";
import { PrismaPilote } from "@/server/db/PrismaPilote";
import { InMemoryTransaction } from "@/server/db/InMemoryTransaction";
import { createIntegrationTest } from "@/server/infrastructure/test/createIntegrationTest";
import { fixtures } from "@/server/infrastructure/test/fixtures";

describe("RetournerAppreciationHandler", () => {
  let handler: RetournerAppreciationHandler;
  const prismaPilote = new PrismaPilote();
  const transaction = new InMemoryTransaction();

  beforeEach(() => {
    handler = new RetournerAppreciationHandler({
      transaction,
      prisma: prismaPilote,
    });
  });

  describe("#execute", () => {
    it(
      "doit échouer si une fiche n'est pas en étape INSTRUCTION",
      createIntegrationTest(async () => {
        // Given
        const fiche = await fixtures.fiche({
          etape_courante: "CONSOLIDATION",
        });

        // When/Then
        await expect(
          handler.execute({
            ficheEvaluationIds: [fiche.id],
          }),
        ).rejects.toThrow(
          "Toutes les fiches doivent être en étape INSTRUCTION pour retourner à l'appréciation",
        );
      }),
    );

    it(
      "doit échouer si une fiche parmi plusieurs n'est pas en étape INSTRUCTION",
      createIntegrationTest(async () => {
        // Given
        const fiche1 = await fixtures.fiche({
          etape_courante: "INSTRUCTION",
        });
        const fiche2 = await fixtures.fiche({
          etape_courante: "CONSOLIDATION",
        });

        // When/Then
        await expect(
          handler.execute({
            ficheEvaluationIds: [fiche1.id, fiche2.id],
          }),
        ).rejects.toThrow(
          "Toutes les fiches doivent être en étape INSTRUCTION pour retourner à l'appréciation",
        );
      }),
    );

    it(
      "doit mettre à jour l'étape courante vers CONSOLIDATION",
      createIntegrationTest(async (tx) => {
        // Given
        const fiche = await fixtures.fiche({
          etape_courante: "INSTRUCTION",
        });

        await fixtures.etapeEvaluation({
          fiche_evaluation_id: fiche.id,
          type: "AUTO_EVALUATION",
        });
        await fixtures.etapeEvaluation({
          fiche_evaluation_id: fiche.id,
          type: "CONSOLIDATION",
        });
        await fixtures.etapeEvaluation({
          fiche_evaluation_id: fiche.id,
          type: "INSTRUCTION",
        });

        // When
        await handler.execute({
          ficheEvaluationIds: [fiche.id],
        });

        // Then
        const ficheEvaluation = await tx.fiche_evaluation.findUniqueOrThrow({
          where: { id: fiche.id },
        });
        expect(ficheEvaluation.etape_courante).toBe("CONSOLIDATION");
      }),
    );

    it(
      "doit remettre l'étape CONSOLIDATION en écriture",
      createIntegrationTest(async (tx) => {
        // Given
        const fiche = await fixtures.fiche({
          etape_courante: "INSTRUCTION",
        });

        await fixtures.etapeEvaluation({
          fiche_evaluation_id: fiche.id,
          type: "AUTO_EVALUATION",
        });

        const etapeConsolidation = await fixtures.etapeEvaluation({
          fiche_evaluation_id: fiche.id,
          type: "CONSOLIDATION",
          read_only: true,
          objectifs_valides: true,
          criteres_valides: true,
        });

        await fixtures.etapeEvaluation({
          fiche_evaluation_id: fiche.id,
          type: "INSTRUCTION",
        });

        // When
        await handler.execute({
          ficheEvaluationIds: [fiche.id],
        });

        // Then
        const etapeUpdated = await tx.etape_evaluation.findUniqueOrThrow({
          where: { id: etapeConsolidation.id },
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
