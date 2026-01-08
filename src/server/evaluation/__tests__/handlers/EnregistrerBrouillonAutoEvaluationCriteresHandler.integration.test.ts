import { randomUUID } from "node:crypto";
import { EnregistrerBrouillonAutoEvaluationCriteresHandler } from "@/server/evaluation/handlers/EnregistrerBrouillonAutoEvaluationCriteresHandler";
import { PrismaPilote } from "@/server/db/PrismaPilote";
import { InMemoryTransaction } from "@/server/db/InMemoryTransaction";
import { createIntegrationTest } from "@/server/infrastructure/test/createIntegrationTest";
import { fixtures } from "@/server/infrastructure/test/fixtures";

describe("EnregistrerBrouillonAutoEvaluationCriteresHandler", () => {
  let handler: EnregistrerBrouillonAutoEvaluationCriteresHandler;
  const prismaPilote = new PrismaPilote();
  const transaction = new InMemoryTransaction();

  beforeEach(() => {
    handler = new EnregistrerBrouillonAutoEvaluationCriteresHandler({
      prisma: prismaPilote,
      transaction,
    });
  });

  describe("execute", () => {
    it(
      "doit créer de nouvelles évaluations de critères quand aucune n'existe",
      createIntegrationTest(async (tx) => {
        // Given
        const utilisateur = await fixtures.utilisateur();
        const critere = await fixtures.critere();
        const etape = await fixtures.etapeEvaluation({
          type: "AUTO_EVALUATION",
        });
        const evaluationCritereId = randomUUID();

        // When
        await handler.execute(
          {
            ficheEvaluationId: etape.fiche_evaluation_id,
            evaluationsCriteres: [
              {
                id: evaluationCritereId,
                critereId: critere.id,
                note: 3,
                commentaire: "Acceptable",
                annexe: "une annexe",
              },
            ],
          },
          utilisateur.id,
        );

        // Then
        const evaluationCritere = await tx.evaluation_critere.findUnique({
          where: { id: evaluationCritereId },
        });
        expect(evaluationCritere).toMatchObject({
          id: evaluationCritereId,
          etape_evaluation_id: etape.id,
          critere_id: critere.id,
          auteur_id: utilisateur.id,
          note: 3,
          commentaire: "Acceptable",
          annexe: "une annexe",
        });
      }),
    );

    it(
      "doit mettre à jour des évaluations de critères existantes",
      createIntegrationTest(async (tx) => {
        // Given
        const utilisateur = await fixtures.utilisateur();
        const critere = await fixtures.critere();
        const etape = await fixtures.etapeEvaluation({
          type: "AUTO_EVALUATION",
        });

        const evalCritere = await fixtures.evaluationCritere({
          etape_evaluation_id: etape.id,
          critere_id: critere.id,
          auteur_id: utilisateur.id,
          note: 1,
          commentaire: "Initial critère",
        });

        // When
        await handler.execute(
          {
            ficheEvaluationId: etape.fiche_evaluation_id,
            evaluationsCriteres: [
              {
                id: evalCritere.id,
                critereId: critere.id,
                note: 4,
                commentaire: "Updated critère",
                annexe: "une annexe",
              },
            ],
          },
          utilisateur.id,
        );

        // Then
        const evaluationCritere = await tx.evaluation_critere.findUnique({
          where: { id: evalCritere.id },
        });
        expect(evaluationCritere).toMatchObject({
          note: 4,
          commentaire: "Updated critère",
          annexe: "une annexe",
        });
      }),
    );

    it(
      "doit mettre à jour la date de modification de l'étape",
      createIntegrationTest(async (tx) => {
        // Given
        const utilisateur = await fixtures.utilisateur();
        const initialDate = new Date("2025-01-01T00:00:00Z");
        const etape = await fixtures.etapeEvaluation({
          type: "AUTO_EVALUATION",
          updated_at: initialDate,
        });

        // When
        await handler.execute(
          {
            ficheEvaluationId: etape.fiche_evaluation_id,
            evaluationsCriteres: [],
          },
          utilisateur.id,
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
      "doit gérer les notes nulles pour les critères",
      createIntegrationTest(async (tx) => {
        // Given
        const utilisateur = await fixtures.utilisateur();
        const critere = await fixtures.critere();
        const etape = await fixtures.etapeEvaluation({
          type: "AUTO_EVALUATION",
        });

        const evaluationCritereId = randomUUID();

        // When
        await handler.execute(
          {
            ficheEvaluationId: etape.fiche_evaluation_id,
            evaluationsCriteres: [
              {
                id: evaluationCritereId,
                critereId: critere.id,
                note: null,
                commentaire: "En cours",
                annexe: "une annexe",
              },
            ],
          },
          utilisateur.id,
        );

        // Then
        const evaluationCritere = await tx.evaluation_critere.findUnique({
          where: { id: evaluationCritereId },
        });
        expect(evaluationCritere).toMatchObject({
          note: null,
          commentaire: "En cours",
          annexe: "une annexe",
        });
      }),
    );

    it(
      "doit échouer si la fiche n'est pas en étape AUTO_EVALUATION",
      createIntegrationTest(async () => {
        // Given
        const utilisateur = await fixtures.utilisateur();
        const etape = await fixtures.etapeEvaluation({
          type: "AUTO_EVALUATION",
          fiche: { etape_courante: "CONSOLIDATION" },
        });

        // When/Then
        await expect(
          handler.execute(
            {
              ficheEvaluationId: etape.fiche_evaluation_id,
              evaluationsCriteres: [],
            },
            utilisateur.id,
          ),
        ).rejects.toThrow();
      }),
    );
  });
});
