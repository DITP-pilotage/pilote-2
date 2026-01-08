import { ValiderSaisieCriteresHandler } from "@/server/evaluation/handlers/ValiderSaisieCriteresHandler";
import { PrismaPilote } from "@/server/db/PrismaPilote";
import { InMemoryTransaction } from "@/server/db/InMemoryTransaction";
import { SoumettreEtapeEvaluationService } from "@/server/evaluation/services/SoumettreEtapeEvaluationService";
import { createIntegrationTest } from "@/server/infrastructure/test/createIntegrationTest";
import { fixtures } from "@/server/infrastructure/test/fixtures";

describe("ValiderSaisieCriteresHandler", () => {
  let handler: ValiderSaisieCriteresHandler;
  const prismaPilote = new PrismaPilote();
  const transaction = new InMemoryTransaction();
  const soumettreEtapeEvaluationService = new SoumettreEtapeEvaluationService({
    prisma: prismaPilote,
    transaction,
  });

  beforeEach(() => {
    handler = new ValiderSaisieCriteresHandler({
      prisma: prismaPilote,
      transaction,
      soumettreEtapeEvaluationService,
    });
  });

  describe("execute", () => {
    it(
      "doit marquer les critères comme validés",
      createIntegrationTest(async (tx) => {
        // Given
        const fiche = await fixtures.fiche({
          etape_courante: "AUTO_EVALUATION",
        });

        const etape = await fixtures.etapeEvaluation({
          fiche_evaluation_id: fiche.id,
          type: "AUTO_EVALUATION",
          objectifs_valides: false,
          criteres_valides: false,
        });

        // When
        await handler.execute(
          {
            ficheEvaluationId: fiche.id,
          },
          "auteur-test-id",
        );

        // Then
        const etapeUpdated = await tx.etape_evaluation.findUniqueOrThrow({
          where: { id: etape.id },
        });
        expect(etapeUpdated.criteres_valides).toBe(true);
        expect(etapeUpdated.objectifs_valides).toBe(false);
      }),
    );

    it(
      "doit mettre à jour la date de modification",
      createIntegrationTest(async (tx) => {
        // Given
        const initialDate = new Date("2025-01-01T00:00:00Z");

        const fiche = await fixtures.fiche({
          etape_courante: "AUTO_EVALUATION",
        });

        const etape = await fixtures.etapeEvaluation({
          fiche_evaluation_id: fiche.id,
          type: "AUTO_EVALUATION",
          objectifs_valides: false,
          criteres_valides: false,
          updated_at: initialDate,
        });

        // When
        await handler.execute(
          {
            ficheEvaluationId: fiche.id,
          },
          "auteur-test-id",
        );

        // Then
        const etapeUpdated = await tx.etape_evaluation.findUniqueOrThrow({
          where: { id: etape.id },
        });
        expect(etapeUpdated.updated_at.getTime()).toBeGreaterThan(
          initialDate.getTime(),
        );
      }),
    );

    it(
      "doit échouer si la fiche n'est pas en étape AUTO_EVALUATION",
      createIntegrationTest(async () => {
        // Given
        const fiche = await fixtures.fiche({
          etape_courante: "CONSOLIDATION",
        });

        await fixtures.etapeEvaluation({
          fiche_evaluation_id: fiche.id,
          type: "AUTO_EVALUATION",
          objectifs_valides: false,
          criteres_valides: false,
        });

        // When/Then
        await expect(
          handler.execute(
            {
              ficheEvaluationId: fiche.id,
            },
            "auteur-test-id",
          ),
        ).rejects.toThrow();
      }),
    );

    it(
      "peut valider les critères même si les objectifs sont déjà validés",
      createIntegrationTest(async (tx) => {
        // Given
        const fiche = await fixtures.fiche({
          etape_courante: "AUTO_EVALUATION",
        });

        const etape = await fixtures.etapeEvaluation({
          fiche_evaluation_id: fiche.id,
          type: "AUTO_EVALUATION",
          objectifs_valides: true,
          criteres_valides: false,
        });

        // When
        await handler.execute(
          {
            ficheEvaluationId: fiche.id,
          },
          "auteur-test-id",
        );

        // Then
        const etapeUpdated = await tx.etape_evaluation.findUniqueOrThrow({
          where: { id: etape.id },
        });
        expect(etapeUpdated.criteres_valides).toBe(true);
        expect(etapeUpdated.objectifs_valides).toBe(true);
      }),
    );

    it(
      "doit passer à l'étape CONSOLIDATION quand les objectifs sont déjà validés",
      createIntegrationTest(async (tx) => {
        // Given
        const auteurId = "auteur-test-id";
        const fiche = await fixtures.fiche({
          etape_courante: "AUTO_EVALUATION",
        });

        await fixtures.etapeEvaluation({
          fiche_evaluation_id: fiche.id,
          type: "AUTO_EVALUATION",
          objectifs_valides: true,
          criteres_valides: false,
        });

        // When
        await handler.execute(
          {
            ficheEvaluationId: fiche.id,
          },
          auteurId,
        );

        // Then
        const ficheEvaluation = await tx.fiche_evaluation.findUniqueOrThrow({
          where: { id: fiche.id },
        });
        expect(ficheEvaluation.etape_courante).toBe("CONSOLIDATION");

        const etapeConsolidation = await tx.etape_evaluation.findFirst({
          where: {
            fiche_evaluation_id: fiche.id,
            type: "CONSOLIDATION",
          },
        });
        expect(etapeConsolidation).not.toBeNull();
      }),
    );
  });
});
