import { randomUUID } from "node:crypto";
import { EnregistrerBrouillonConsolidationHandler } from "@/server/evaluation/handlers/EnregistrerBrouillonConsolidationHandler";
import { PrismaPilote } from "@/server/db/PrismaPilote";
import { InMemoryTransaction } from "@/server/db/InMemoryTransaction";
import { createIntegrationTest } from "@/server/infrastructure/test/createIntegrationTest";
import { fixtures } from "@/server/infrastructure/test/fixtures";

describe("EnregistrerBrouillonConsolidationHandler", () => {
  let handler: EnregistrerBrouillonConsolidationHandler;
  const prismaPilote = new PrismaPilote();
  const transaction = new InMemoryTransaction();

  beforeEach(() => {
    handler = new EnregistrerBrouillonConsolidationHandler({
      prisma: prismaPilote,
      transaction,
    });
  });

  describe("execute", () => {
    it(
      "doit créer de nouvelles évaluations quand aucune n'existe",
      createIntegrationTest(async (tx) => {
        // Given
        const utilisateur = await fixtures.utilisateur();
        const critere = await fixtures.critere();
        const objectif = await fixtures.objectif();
        const etape = await fixtures.etapeEvaluation({
          fiche: {
            rattachement_code: objectif.rattachement_code,
            etape_courante: "CONSOLIDATION",
          },
          type: "CONSOLIDATION",
        });

        const evaluationObjectifId = randomUUID();
        const evaluationCritereId = randomUUID();

        // When
        await handler.execute(
          [
            {
              ficheEvaluationId: etape.fiche_evaluation_id,
              evaluationsObjectifs: [
                {
                  id: evaluationObjectifId,
                  objectifId: objectif.id,
                  note: 4,
                  commentaire: "Bon objectif",
                  annexe: "une annexe",
                },
              ],
              evaluationsCriteres: [
                {
                  id: evaluationCritereId,
                  critereId: critere.id,
                  note: 3,
                  commentaire: "Acceptable",
                  annexe: "une annexe 2",
                },
              ],
            },
          ],
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
          annexe: "une annexe 2",
        });
      }),
    );

    it(
      "doit mettre à jour des évaluations existantes",
      createIntegrationTest(async (tx) => {
        // Given
        const utilisateur = await fixtures.utilisateur();
        const critere = await fixtures.critere();
        const objectif = await fixtures.objectif();
        const etape = await fixtures.etapeEvaluation({
          fiche: {
            rattachement_code: objectif.rattachement_code,
            etape_courante: "CONSOLIDATION",
          },
          type: "CONSOLIDATION",
        });

        const evalObjectif = await fixtures.evaluationObjectif({
          etape_evaluation_id: etape.id,
          objectif_id: objectif.id,
          auteur_id: utilisateur.id,
          note: 2,
          commentaire: "Initial comment",
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
          [
            {
              ficheEvaluationId: etape.fiche_evaluation_id,
              evaluationsObjectifs: [
                {
                  id: evalObjectif.id,
                  objectifId: objectif.id,
                  note: 5,
                  commentaire: "Updated comment",
                  annexe: "une annexe",
                },
              ],
              evaluationsCriteres: [
                {
                  id: evalCritere.id,
                  critereId: critere.id,
                  note: 4,
                  commentaire: "Updated critère",
                  annexe: "une annexe 2",
                },
              ],
            },
          ],
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

        const evaluationCritere = await tx.evaluation_critere.findUnique({
          where: { id: evalCritere.id },
        });
        expect(evaluationCritere).toMatchObject({
          note: 4,
          commentaire: "Updated critère",
          annexe: "une annexe 2",
        });
      }),
    );

    it(
      "doit mettre à jour la date de modification de l'étape",
      createIntegrationTest(async (tx) => {
        // Given
        const utilisateur = await fixtures.utilisateur();
        const fiche = await fixtures.fiche({
          etape_courante: "CONSOLIDATION",
        });
        const initialDate = new Date("2025-01-01T00:00:00Z");
        const etape = await fixtures.etapeEvaluation({
          fiche_evaluation_id: fiche.id,
          type: "CONSOLIDATION",
          updated_at: initialDate,
        });

        // When
        await handler.execute(
          [
            {
              ficheEvaluationId: fiche.id,
              evaluationsObjectifs: [],
              evaluationsCriteres: [],
            },
          ],
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
      "doit gérer les notes nulles",
      createIntegrationTest(async (tx) => {
        // Given
        const utilisateur = await fixtures.utilisateur();
        const critere = await fixtures.critere();
        const objectif = await fixtures.objectif();
        const etape = await fixtures.etapeEvaluation({
          fiche: {
            rattachement_code: objectif.rattachement_code,
            etape_courante: "CONSOLIDATION",
          },
          type: "CONSOLIDATION",
        });

        const evaluationObjectifId = randomUUID();
        const evaluationCritereId = randomUUID();

        // When
        await handler.execute(
          [
            {
              ficheEvaluationId: etape.fiche_evaluation_id,
              evaluationsObjectifs: [
                {
                  id: evaluationObjectifId,
                  objectifId: objectif.id,
                  note: null,
                  commentaire: "Pas encore évalué",
                  annexe: "une annexe",
                },
              ],
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
          ],
          utilisateur.id,
        );

        // Then
        const evaluationObjectif = await tx.evaluation_objectif.findUnique({
          where: { id: evaluationObjectifId },
        });
        expect(evaluationObjectif).toMatchObject({
          note: null,
          commentaire: "Pas encore évalué",
        });

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
      "doit échouer si la fiche n'est pas en étape CONSOLIDATION",
      createIntegrationTest(async () => {
        // Given
        const utilisateur = await fixtures.utilisateur();
        const etape = await fixtures.etapeEvaluation({
          fiche: { etape_courante: "INSTRUCTION" },
          type: "CONSOLIDATION",
        });

        // When/Then
        await expect(
          handler.execute(
            [
              {
                ficheEvaluationId: etape.fiche_evaluation_id,
                evaluationsObjectifs: [],
                evaluationsCriteres: [],
              },
            ],
            utilisateur.id,
          ),
        ).rejects.toThrow();
      }),
    );
  });
});
