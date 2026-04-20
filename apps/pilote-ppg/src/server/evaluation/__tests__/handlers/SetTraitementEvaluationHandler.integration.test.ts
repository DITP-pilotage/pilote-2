import { $Enums } from "@prisma/client";
import { PrismaPilote } from "@/server/db/PrismaPilote";
import { InMemoryTransaction } from "@/server/db/InMemoryTransaction";
import { SetTraitementEvaluationHandler } from "@/server/evaluation/handlers/SetTraitementEvaluationHandler";
import { createIntegrationTest } from "@/server/infrastructure/test/createIntegrationTest";
import { fixtures } from "@/server/infrastructure/test/fixtures";

describe("SetTraitementEvaluationHandler", () => {
  let handler: SetTraitementEvaluationHandler;
  const prismaPilote = new PrismaPilote();
  const transaction = new InMemoryTransaction();

  beforeEach(() => {
    handler = new SetTraitementEvaluationHandler({
      prisma: prismaPilote,
      transaction,
    });
  });

  describe("#execute", () => {
    describe("evaluation objectif", () => {
      it(
        "doit définir date_traitement à la date actuelle quand le statut est TRAITEE",
        createIntegrationTest(async (tx) => {
          // Given
          const utilisateur = await fixtures.utilisateur();
          const objectif = await fixtures.objectif();
          const etape = await fixtures.etapeEvaluation({
            fiche: {
              rattachement_code: objectif.rattachement_code,
              etape_courante: $Enums.etape_evaluation_enum.CONSOLIDATION,
            },
            type: $Enums.etape_evaluation_enum.CONSOLIDATION,
            read_only: false,
          });

          const evaluationObjectif = await fixtures.evaluationObjectif({
            etape_evaluation_id: etape.id,
            objectif_id: objectif.id,
            auteur_id: utilisateur.id,
            note: 3,
            commentaire: "Commentaire test",
            date_traitement: null,
          });

          // When
          await handler.execute({
            evaluationId: evaluationObjectif.id,
            typeEvaluation: "OBJECTIF",
            statut: "TRAITEE",
          });

          // Then
          const evaluationUpdated = await tx.evaluation_objectif.findUnique({
            where: { id: evaluationObjectif.id },
          });

          expect(evaluationUpdated?.date_traitement).toBeInstanceOf(Date);
        }),
      );

      it(
        "doit définir date_traitement à null quand le statut est NON_TRAITEE",
        createIntegrationTest(async (tx) => {
          // Given
          const utilisateur = await fixtures.utilisateur();
          const objectif = await fixtures.objectif();
          const etape = await fixtures.etapeEvaluation({
            fiche: {
              rattachement_code: objectif.rattachement_code,
              etape_courante: $Enums.etape_evaluation_enum.CONSOLIDATION,
            },
            type: $Enums.etape_evaluation_enum.CONSOLIDATION,
            read_only: false,
          });

          const evaluationObjectif = await fixtures.evaluationObjectif({
            etape_evaluation_id: etape.id,
            objectif_id: objectif.id,
            auteur_id: utilisateur.id,
            note: 3,
            commentaire: "Commentaire test",
            date_traitement: new Date(),
          });

          // When
          await handler.execute({
            evaluationId: evaluationObjectif.id,
            typeEvaluation: "OBJECTIF",
            statut: "NON_TRAITEE",
          });

          // Then
          const evaluationUpdated = await tx.evaluation_objectif.findUnique({
            where: { id: evaluationObjectif.id },
          });

          expect(evaluationUpdated?.date_traitement).toBeNull();
        }),
      );
    });

    describe("evaluation critere", () => {
      it(
        "doit définir date_traitement à la date actuelle quand le statut est TRAITEE",
        createIntegrationTest(async (tx) => {
          // Given
          const utilisateur = await fixtures.utilisateur();
          const critere = await fixtures.critere();
          const etape = await fixtures.etapeEvaluation({
            fiche: {
              etape_courante: $Enums.etape_evaluation_enum.CONSOLIDATION,
            },
            type: $Enums.etape_evaluation_enum.CONSOLIDATION,
            read_only: false,
          });

          const evaluationCritere = await fixtures.evaluationCritere({
            etape_evaluation_id: etape.id,
            critere_id: critere.id,
            auteur_id: utilisateur.id,
            note: 3,
            commentaire: "Commentaire test",
            date_traitement: null,
          });

          // When
          await handler.execute({
            evaluationId: evaluationCritere.id,
            typeEvaluation: "MANIERE_DE_SERVIR",
            statut: "TRAITEE",
          });

          // Then
          const evaluationUpdated = await tx.evaluation_critere.findUnique({
            where: { id: evaluationCritere.id },
          });

          expect(evaluationUpdated?.date_traitement).not.toBeNull();
          expect(evaluationUpdated?.date_traitement).toBeInstanceOf(Date);
        }),
      );

      it(
        "doit définir date_traitement à null quand le statut est NON_TRAITEE",
        createIntegrationTest(async (tx) => {
          // Given
          const utilisateur = await fixtures.utilisateur();
          const critere = await fixtures.critere();
          const etape = await fixtures.etapeEvaluation({
            fiche: {
              etape_courante: $Enums.etape_evaluation_enum.CONSOLIDATION,
            },
            type: $Enums.etape_evaluation_enum.CONSOLIDATION,
            read_only: false,
          });

          const evaluationCritere = await fixtures.evaluationCritere({
            etape_evaluation_id: etape.id,
            critere_id: critere.id,
            auteur_id: utilisateur.id,
            note: 3,
            commentaire: "Commentaire test",
            date_traitement: new Date(),
          });

          // When
          await handler.execute({
            evaluationId: evaluationCritere.id,
            typeEvaluation: "MANIERE_DE_SERVIR",
            statut: "NON_TRAITEE",
          });

          // Then
          const evaluationUpdated = await tx.evaluation_critere.findUnique({
            where: { id: evaluationCritere.id },
          });

          expect(evaluationUpdated?.date_traitement).toBeNull();
        }),
      );
    });

    it(
      "doit définir date_traitement quand la fiche est en état INSTRUCTION",
      createIntegrationTest(async (tx) => {
        // Given
        const utilisateur = await fixtures.utilisateur();
        const objectif = await fixtures.objectif();
        const etape = await fixtures.etapeEvaluation({
          fiche: {
            rattachement_code: objectif.rattachement_code,
            etape_courante: $Enums.etape_evaluation_enum.INSTRUCTION,
          },
          type: $Enums.etape_evaluation_enum.INSTRUCTION,
          read_only: false,
        });

        const evaluationObjectif = await fixtures.evaluationObjectif({
          etape_evaluation_id: etape.id,
          objectif_id: objectif.id,
          auteur_id: utilisateur.id,
          note: 3,
          commentaire: "Commentaire test",
          date_traitement: null,
        });

        // When
        await handler.execute({
          evaluationId: evaluationObjectif.id,
          typeEvaluation: "OBJECTIF",
          statut: "TRAITEE",
        });

        // Then
        const evaluationUpdated = await tx.evaluation_objectif.findUnique({
          where: { id: evaluationObjectif.id },
        });

        expect(evaluationUpdated?.date_traitement).toBeInstanceOf(Date);
      }),
    );

    it(
      "doit échouer si la fiche n'est pas en état CONSOLIDATION ou INSTRUCTION",
      createIntegrationTest(async () => {
        // Given
        const utilisateur = await fixtures.utilisateur();
        const objectif = await fixtures.objectif();
        const etape = await fixtures.etapeEvaluation({
          fiche: {
            rattachement_code: objectif.rattachement_code,
            etape_courante: $Enums.etape_evaluation_enum.AUTO_EVALUATION,
          },
          type: $Enums.etape_evaluation_enum.AUTO_EVALUATION,
          read_only: false,
        });

        const evaluationObjectif = await fixtures.evaluationObjectif({
          etape_evaluation_id: etape.id,
          objectif_id: objectif.id,
          auteur_id: utilisateur.id,
          note: 3,
          commentaire: "Commentaire test",
          date_traitement: null,
        });

        // When/Then
        await expect(
          handler.execute({
            evaluationId: evaluationObjectif.id,
            typeEvaluation: "OBJECTIF",
            statut: "TRAITEE",
          }),
        ).rejects.toThrow(
          "La fiche d'évaluation doit être en état CONSOLIDATION ou INSTRUCTION",
        );
      }),
    );

    it(
      "doit échouer si la note de l'évaluation objectif est null",
      createIntegrationTest(async () => {
        // Given
        const utilisateur = await fixtures.utilisateur();
        const objectif = await fixtures.objectif();
        const etape = await fixtures.etapeEvaluation({
          fiche: {
            rattachement_code: objectif.rattachement_code,
            etape_courante: $Enums.etape_evaluation_enum.CONSOLIDATION,
          },
          type: $Enums.etape_evaluation_enum.CONSOLIDATION,
          read_only: false,
        });

        const evaluationObjectif = await fixtures.evaluationObjectif({
          etape_evaluation_id: etape.id,
          objectif_id: objectif.id,
          auteur_id: utilisateur.id,
          note: null,
          commentaire: "Commentaire test",
          date_traitement: null,
        });

        // When/Then
        await expect(
          handler.execute({
            evaluationId: evaluationObjectif.id,
            typeEvaluation: "OBJECTIF",
            statut: "TRAITEE",
          }),
        ).rejects.toThrow("La note de l'évaluation ne peut pas être null");
      }),
    );

    it(
      "doit échouer si la note de l'évaluation critere est null",
      createIntegrationTest(async () => {
        // Given
        const utilisateur = await fixtures.utilisateur();
        const critere = await fixtures.critere();
        const etape = await fixtures.etapeEvaluation({
          fiche: {
            etape_courante: $Enums.etape_evaluation_enum.CONSOLIDATION,
          },
          type: $Enums.etape_evaluation_enum.CONSOLIDATION,
          read_only: false,
        });

        const evaluationCritere = await fixtures.evaluationCritere({
          etape_evaluation_id: etape.id,
          critere_id: critere.id,
          auteur_id: utilisateur.id,
          note: null,
          commentaire: "Commentaire test",
          date_traitement: null,
        });

        // When/Then
        await expect(
          handler.execute({
            evaluationId: evaluationCritere.id,
            typeEvaluation: "MANIERE_DE_SERVIR",
            statut: "TRAITEE",
          }),
        ).rejects.toThrow("La note de l'évaluation ne peut pas être null");
      }),
    );
  });
});
