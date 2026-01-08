import { PrismaPilote } from "@/server/db/PrismaPilote";
import { InMemoryTransaction } from "@/server/db/InMemoryTransaction";
import { ModifierEtatFichesInstructionHandler } from "@/server/evaluation/handlers/ModifierEtatFichesInstructionHandler";
import { createIntegrationTest } from "@/server/infrastructure/test/createIntegrationTest";
import { fixtures } from "@/server/infrastructure/test/fixtures";

describe("ModifierEtatFichesInstructionHandler", () => {
  let handler: ModifierEtatFichesInstructionHandler;
  const prismaPilote = new PrismaPilote();
  const transaction = new InMemoryTransaction();

  beforeEach(() => {
    handler = new ModifierEtatFichesInstructionHandler({
      prisma: prismaPilote,
      transaction,
    });
  });

  describe("#execute", () => {
    it(
      "doit débloquer plusieurs fiches instruction en une seule opération",
      createIntegrationTest(async (tx) => {
        // Given
        const fiche1 = await fixtures.fiche({
          etape_courante: "INSTRUCTION",
        });
        const fiche2 = await fixtures.fiche({
          etape_courante: "INSTRUCTION",
        });
        const fiche3 = await fixtures.fiche({
          etape_courante: "INSTRUCTION",
        });
        const fiche4 = await fixtures.fiche({
          etape_courante: "INSTRUCTION",
        });
        const fiche5 = await fixtures.fiche({
          etape_courante: "CONSOLIDATION",
        });

        const etape1 = await fixtures.etapeEvaluation({
          fiche_evaluation_id: fiche1.id,
          type: "INSTRUCTION",
          read_only: true,
        });
        const etape2 = await fixtures.etapeEvaluation({
          fiche_evaluation_id: fiche2.id,
          type: "INSTRUCTION",
          read_only: true,
        });
        const etape3 = await fixtures.etapeEvaluation({
          fiche_evaluation_id: fiche3.id,
          type: "INSTRUCTION",
          read_only: false,
        });
        const etape4 = await fixtures.etapeEvaluation({
          fiche_evaluation_id: fiche4.id,
          type: "INSTRUCTION",
          read_only: true,
        });
        const etape5 = await fixtures.etapeEvaluation({
          fiche_evaluation_id: fiche5.id,
          type: "CONSOLIDATION",
          read_only: true,
        });

        // When
        await handler.execute({
          ficheEvaluationIds: [fiche1.id, fiche2.id, fiche3.id, fiche5.id],
          readOnly: false,
        });

        // Then
        const etape1Updated = await tx.etape_evaluation.findUnique({
          where: { id: etape1.id },
        });
        const etape2Updated = await tx.etape_evaluation.findUnique({
          where: { id: etape2.id },
        });
        const etape3Updated = await tx.etape_evaluation.findUnique({
          where: { id: etape3.id },
        });
        const etape4Updated = await tx.etape_evaluation.findUnique({
          where: { id: etape4.id },
        });
        const etape5Updated = await tx.etape_evaluation.findUnique({
          where: { id: etape5.id },
        });

        expect(etape1Updated?.read_only).toBe(false);
        expect(etape2Updated?.read_only).toBe(false);
        expect(etape3Updated?.read_only).toBe(false);
        expect(etape4Updated?.read_only).toBe(true);
        expect(etape5Updated?.read_only).toBe(true);
      }),
    );

    it(
      "doit bloquer plusieurs fiches instruction en une seule opération",
      createIntegrationTest(async (tx) => {
        // Given
        const etape1 = await fixtures.etapeEvaluation({
          type: "INSTRUCTION",
          read_only: false,
          fiche: { etape_courante: "INSTRUCTION" },
        });
        const etape2 = await fixtures.etapeEvaluation({
          type: "INSTRUCTION",
          read_only: false,
          fiche: { etape_courante: "INSTRUCTION" },
        });
        const etape3 = await fixtures.etapeEvaluation({
          type: "INSTRUCTION",
          read_only: true,
          fiche: { etape_courante: "INSTRUCTION" },
        });
        const etape4 = await fixtures.etapeEvaluation({
          type: "INSTRUCTION",
          read_only: false,
          fiche: { etape_courante: "INSTRUCTION" },
        });
        const etape5 = await fixtures.etapeEvaluation({
          type: "CONSOLIDATION",
          read_only: false,
          fiche: { etape_courante: "CONSOLIDATION" },
        });

        // When
        await handler.execute({
          ficheEvaluationIds: [
            etape1.fiche_evaluation_id,
            etape2.fiche_evaluation_id,
            etape3.fiche_evaluation_id,
            etape5.fiche_evaluation_id,
          ],
          readOnly: true,
        });

        // Then
        const etape1Updated = await tx.etape_evaluation.findUnique({
          where: { id: etape1.id },
        });
        const etape2Updated = await tx.etape_evaluation.findUnique({
          where: { id: etape2.id },
        });
        const etape3Updated = await tx.etape_evaluation.findUnique({
          where: { id: etape3.id },
        });
        const etape4Updated = await tx.etape_evaluation.findUnique({
          where: { id: etape4.id },
        });
        const etape5Updated = await tx.etape_evaluation.findUnique({
          where: { id: etape5.id },
        });

        expect(etape1Updated?.read_only).toBe(true);
        expect(etape2Updated?.read_only).toBe(true);
        expect(etape3Updated?.read_only).toBe(true);
        expect(etape4Updated?.read_only).toBe(false);
        expect(etape5Updated?.read_only).toBe(false);
      }),
    );

    it(
      "ne doit modifier que l'étape INSTRUCTION et pas les autres étapes",
      createIntegrationTest(async (tx) => {
        // Given
        const fiche = await fixtures.fiche({
          etape_courante: "INSTRUCTION",
        });

        const etapeAuto = await fixtures.etapeEvaluation({
          fiche_evaluation_id: fiche.id,
          type: "AUTO_EVALUATION",
          read_only: true,
        });
        const etapeConso = await fixtures.etapeEvaluation({
          fiche_evaluation_id: fiche.id,
          type: "CONSOLIDATION",
          read_only: true,
        });
        const etapeInstruction = await fixtures.etapeEvaluation({
          fiche_evaluation_id: fiche.id,
          type: "INSTRUCTION",
          read_only: true,
        });

        // When
        await handler.execute({
          ficheEvaluationIds: [fiche.id],
          readOnly: false,
        });

        // Then
        const etapeAutoUpdated = await tx.etape_evaluation.findUnique({
          where: { id: etapeAuto.id },
        });
        const etapeConsoUpdated = await tx.etape_evaluation.findUnique({
          where: { id: etapeConso.id },
        });
        const etapeInstructionUpdated = await tx.etape_evaluation.findUnique({
          where: { id: etapeInstruction.id },
        });

        expect(etapeAutoUpdated?.read_only).toBe(true);
        expect(etapeConsoUpdated?.read_only).toBe(true);
        expect(etapeInstructionUpdated?.read_only).toBe(false);
      }),
    );

    it(
      "ne doit rien faire si la liste de fiches est vide",
      createIntegrationTest(async (tx) => {
        // Given
        const etapeInstruction = await fixtures.etapeEvaluation({
          type: "INSTRUCTION",
          read_only: true,
          fiche: { etape_courante: "INSTRUCTION" },
        });

        // When
        await handler.execute({
          ficheEvaluationIds: [],
          readOnly: false,
        });

        // Then
        const etapeInstructionUpdated = await tx.etape_evaluation.findUnique({
          where: { id: etapeInstruction.id },
        });

        expect(etapeInstructionUpdated?.read_only).toBe(true);
      }),
    );
  });
});
