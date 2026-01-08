import { EnregistrerBrouillonAutoEvaluationObjectifsHandler } from "@/server/evaluation/handlers/EnregistrerBrouillonAutoEvaluationObjectifsHandler";
import { PrismaPilote } from "@/server/db/PrismaPilote";
import { InMemoryTransaction } from "@/server/db/InMemoryTransaction";
import { createIntegrationTest } from "@/server/infrastructure/test/createIntegrationTest";
import { fixtures } from "@/server/infrastructure/test/fixtures";

describe("EnregistrerBrouillonAutoEvaluationObjectifsHandler", () => {
  let handler: EnregistrerBrouillonAutoEvaluationObjectifsHandler;
  const prismaPilote = new PrismaPilote();
  const transaction = new InMemoryTransaction();

  beforeEach(() => {
    handler = new EnregistrerBrouillonAutoEvaluationObjectifsHandler({
      prisma: prismaPilote,
      transaction,
    });
  });

  describe("execute", () => {
    it(
      "doit créer de nouvelles évaluations d'objectifs quand aucune n'existe",
      createIntegrationTest(async (tx) => {
        // Given
        const utilisateur = await fixtures.utilisateur();
        const rattachement = await fixtures.rattachement();
        const objectif = await fixtures.objectif({
          rattachement_code: rattachement.code,
        });
        const fiche = await fixtures.fiche({
          rattachement_code: objectif.rattachement_code,
          etape_courante: "AUTO_EVALUATION",
        });
        const etape = await fixtures.etapeEvaluation({
          fiche_evaluation_id: fiche.id,
          type: "AUTO_EVALUATION",
        });

        const evaluationObjectifId = "a7b8c9d0-e1f2-3456-1234-567890123456";

        // When
        await handler.execute(
          {
            ficheEvaluationId: fiche.id,
            evaluationsObjectifs: [
              {
                id: evaluationObjectifId,
                objectifId: objectif.id,
                note: 4,
                commentaire: "Bon objectif",
                annexe: "une annexe",
              },
            ],
          },
          utilisateur.id,
        );

        // Then
        const evaluationObjectif = await tx.evaluation_objectif.findUnique({
          where: { id: evaluationObjectifId },
        });
        expect(evaluationObjectif).toMatchObject({
          id: evaluationObjectifId,
          etape_evaluation_id: etape.id,
          objectif_id: objectif.id,
          auteur_id: utilisateur.id,
          note: 4,
          commentaire: "Bon objectif",
          annexe: "une annexe",
        });
      }),
    );

    it(
      "doit mettre à jour des évaluations d'objectifs existantes",
      createIntegrationTest(async (tx) => {
        // Given
        const utilisateur = await fixtures.utilisateur();
        const rattachement = await fixtures.rattachement();
        const objectif = await fixtures.objectif({
          rattachement_code: rattachement.code,
        });
        const fiche = await fixtures.fiche({
          rattachement_code: rattachement.code,
          etape_courante: "AUTO_EVALUATION",
        });
        const etape = await fixtures.etapeEvaluation({
          fiche_evaluation_id: fiche.id,
          type: "AUTO_EVALUATION",
        });

        const evalObjectif = await fixtures.evaluationObjectif({
          etape_evaluation_id: etape.id,
          objectif_id: objectif.id,
          auteur_id: utilisateur.id,
          note: 2,
          commentaire: "Initial comment",
        });

        // When
        await handler.execute(
          {
            ficheEvaluationId: fiche.id,
            evaluationsObjectifs: [
              {
                id: evalObjectif.id,
                objectifId: objectif.id,
                note: 5,
                commentaire: "Updated comment",
                annexe: "une annexe",
              },
            ],
          },
          utilisateur.id,
        );

        // Then
        const evaluationObjectif = await tx.evaluation_objectif.findUnique({
          where: { id: evalObjectif.id },
        });
        expect(evaluationObjectif).toMatchObject({
          note: 5,
          commentaire: "Updated comment",
          annexe: "une annexe",
        });
      }),
    );

    it(
      "doit mettre à jour la date de modification de l'étape",
      createIntegrationTest(async (tx) => {
        // Given
        const utilisateur = await fixtures.utilisateur();
        const fiche = await fixtures.fiche({
          etape_courante: "AUTO_EVALUATION",
        });
        const initialDate = new Date("2025-01-01T00:00:00Z");
        const etape = await fixtures.etapeEvaluation({
          fiche_evaluation_id: fiche.id,
          type: "AUTO_EVALUATION",
          updated_at: initialDate,
        });

        // When
        await handler.execute(
          {
            ficheEvaluationId: fiche.id,
            evaluationsObjectifs: [],
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
      "doit gérer les notes nulles pour les objectifs",
      createIntegrationTest(async (tx) => {
        // Given
        const utilisateur = await fixtures.utilisateur();
        const rattachement = await fixtures.rattachement();
        const objectif = await fixtures.objectif({
          rattachement_code: rattachement.code,
        });
        const fiche = await fixtures.fiche({
          rattachement_code: rattachement.code,
          etape_courante: "AUTO_EVALUATION",
        });
        const etape = await fixtures.etapeEvaluation({
          fiche_evaluation_id: fiche.id,
          type: "AUTO_EVALUATION",
        });

        const evaluationObjectifId = "1b9dc0fe-6a00-404c-a0aa-d2f3bcbcfe23";

        // When
        await handler.execute(
          {
            ficheEvaluationId: fiche.id,
            evaluationsObjectifs: [
              {
                id: evaluationObjectifId,
                objectifId: objectif.id,
                note: null,
                commentaire: "Pas encore évalué",
                annexe: "une annexe",
              },
            ],
          },
          utilisateur.id,
        );

        // Then
        const evaluationObjectif = await tx.evaluation_objectif.findUnique({
          where: { id: evaluationObjectifId },
        });
        expect(evaluationObjectif).toMatchObject({
          note: null,
          commentaire: "Pas encore évalué",
          annexe: "une annexe",
        });
      }),
    );

    it(
      "doit échouer si la fiche n'est pas en étape AUTO_EVALUATION",
      createIntegrationTest(async () => {
        // Given
        const utilisateur = await fixtures.utilisateur();
        const fiche = await fixtures.fiche({
          etape_courante: "CONSOLIDATION",
        });
        await fixtures.etapeEvaluation({
          fiche_evaluation_id: fiche.id,
          type: "AUTO_EVALUATION",
        });

        // When/Then
        await expect(
          handler.execute(
            {
              ficheEvaluationId: fiche.id,
              evaluationsObjectifs: [],
            },
            utilisateur.id,
          ),
        ).rejects.toThrow();
      }),
    );
  });
});
