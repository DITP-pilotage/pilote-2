import { PasserALEtapeInstructionHandler } from "@/server/evaluation/handlers/PasserALEtapeInstructionHandler";
import { PrismaPilote } from "@/server/db/PrismaPilote";
import { InMemoryTransaction } from "@/server/db/InMemoryTransaction";
import { SoumettreEtapeEvaluationService } from "@/server/evaluation/services/SoumettreEtapeEvaluationService";
import { createIntegrationTest } from "@/server/infrastructure/test/createIntegrationTest";
import { fixtures } from "@/server/infrastructure/test/fixtures";

describe("PasserALEtapeInstructionHandler", () => {
  let handler: PasserALEtapeInstructionHandler;
  const prismaPilote = new PrismaPilote();
  const transaction = new InMemoryTransaction();
  const soumettreEtapeEvaluationService = new SoumettreEtapeEvaluationService({
    prisma: prismaPilote,
    transaction,
  });

  beforeEach(() => {
    handler = new PasserALEtapeInstructionHandler({
      soumettreEtapeEvaluationService,
    });
  });

  describe("execute", () => {
    it(
      "doit échouer si la fiche n'est pas en étape CONSOLIDATION",
      createIntegrationTest(async () => {
        // Given
        const utilisateur = await fixtures.utilisateur();
        const fiche = await fixtures.fiche({
          etape_courante: "AUTO_EVALUATION",
        });
        await fixtures.etapeEvaluation({
          fiche_evaluation_id: fiche.id,
          type: "CONSOLIDATION",
        });

        // When/Then
        await expect(
          handler.execute({ ficheEvaluationIds: [fiche.id] }, utilisateur.id),
        ).rejects.toThrow();
      }),
    );

    it(
      "doit créer une étape INSTRUCTION avec les évaluations clonées",
      createIntegrationTest(async (tx) => {
        // Given
        const auteurInitial = await fixtures.utilisateur();
        const nouvelAuteur = await fixtures.utilisateur();

        const rattachement = await fixtures.rattachement();
        const objectif = await fixtures.objectif({
          rattachement_code: rattachement.code,
          libelle: "Objectif instruction",
        });
        const critere = await fixtures.critere({
          libelle: "Critère instruction",
        });

        const fiche = await fixtures.fiche({
          rattachement_code: rattachement.code,
          etape_courante: "CONSOLIDATION",
        });

        const etapeConsolidation = await fixtures.etapeEvaluation({
          fiche_evaluation_id: fiche.id,
          type: "CONSOLIDATION",
        });

        await fixtures.evaluationObjectif({
          etape_evaluation_id: etapeConsolidation.id,
          objectif_id: objectif.id,
          auteur_id: auteurInitial.id,
          note: 3,
          commentaire: "Objectif consolidé",
        });

        await fixtures.evaluationCritere({
          etape_evaluation_id: etapeConsolidation.id,
          critere_id: critere.id,
          auteur_id: auteurInitial.id,
          note: 2,
          commentaire: "Critère consolidé",
        });

        // When
        await handler.execute(
          { ficheEvaluationIds: [fiche.id] },
          nouvelAuteur.id,
        );

        // Then
        const etapeInstruction = await tx.etape_evaluation.findFirstOrThrow({
          where: {
            fiche_evaluation_id: fiche.id,
            type: "INSTRUCTION",
          },
          include: {
            evaluations_objectifs: true,
            evaluations_criteres: true,
          },
        });

        expect(etapeInstruction.evaluations_objectifs).toEqual([
          expect.objectContaining({
            objectif_id: objectif.id,
            auteur_id: nouvelAuteur.id,
            note: 3,
            commentaire: "",
          }),
        ]);

        expect(etapeInstruction.evaluations_criteres).toEqual([
          expect.objectContaining({
            critere_id: critere.id,
            auteur_id: nouvelAuteur.id,
            note: 2,
            commentaire: "",
          }),
        ]);
      }),
    );

    it(
      "doit traiter plusieurs fiches en une seule transaction",
      createIntegrationTest(async (tx) => {
        // Given
        const utilisateur = await fixtures.utilisateur();

        const fiche1 = await fixtures.fiche({
          etape_courante: "CONSOLIDATION",
        });
        const fiche2 = await fixtures.fiche({
          etape_courante: "CONSOLIDATION",
        });

        await fixtures.etapeEvaluation({
          fiche_evaluation_id: fiche1.id,
          type: "CONSOLIDATION",
        });
        await fixtures.etapeEvaluation({
          fiche_evaluation_id: fiche2.id,
          type: "CONSOLIDATION",
        });

        // When
        await handler.execute(
          { ficheEvaluationIds: [fiche1.id, fiche2.id] },
          utilisateur.id,
        );

        // Then
        const fichesEvaluation = await tx.fiche_evaluation.findMany({
          where: { id: { in: [fiche1.id, fiche2.id] } },
        });

        expect(fichesEvaluation).toHaveLength(2);
        expect(
          fichesEvaluation.every(
            ({ etape_courante }) => etape_courante === "INSTRUCTION",
          ),
        ).toBe(true);

        const etapesInstruction = await tx.etape_evaluation.findMany({
          where: {
            fiche_evaluation_id: {
              in: [fiche1.id, fiche2.id],
            },
            type: "INSTRUCTION",
          },
        });

        expect(etapesInstruction).toHaveLength(2);
      }),
    );

    it(
      "doit mettre à jour l'étape INSTRUCTION existante si elle n'a pas de notes",
      createIntegrationTest(async (tx) => {
        // Given
        const utilisateur = await fixtures.utilisateur();
        const rattachement = await fixtures.rattachement();
        const objectif = await fixtures.objectif({
          rattachement_code: rattachement.code,
          libelle: "Objectif instruction existante",
        });
        const critere = await fixtures.critere({
          libelle: "Critère existing instruction",
        });

        const fiche = await fixtures.fiche({
          rattachement_code: rattachement.code,
          etape_courante: "CONSOLIDATION",
        });

        const etapeConsolidation = await fixtures.etapeEvaluation({
          fiche_evaluation_id: fiche.id,
          type: "CONSOLIDATION",
        });

        await fixtures.evaluationObjectif({
          etape_evaluation_id: etapeConsolidation.id,
          objectif_id: objectif.id,
          auteur_id: utilisateur.id,
          note: 4,
          commentaire: "Objectif consolidé",
        });

        await fixtures.evaluationCritere({
          etape_evaluation_id: etapeConsolidation.id,
          critere_id: critere.id,
          auteur_id: utilisateur.id,
          note: 3,
          commentaire: "Critère consolidé",
        });

        // Existing INSTRUCTION step with no notes
        const etapeInstruction = await fixtures.etapeEvaluation({
          fiche_evaluation_id: fiche.id,
          type: "INSTRUCTION",
        });

        const evalObjInstruction = await fixtures.evaluationObjectif({
          etape_evaluation_id: etapeInstruction.id,
          objectif_id: objectif.id,
          auteur_id: utilisateur.id,
          note: null,
          commentaire: "",
        });

        const evalCritInstruction = await fixtures.evaluationCritere({
          etape_evaluation_id: etapeInstruction.id,
          critere_id: critere.id,
          auteur_id: utilisateur.id,
          note: null,
          commentaire: "",
        });

        // When
        await handler.execute(
          { ficheEvaluationIds: [fiche.id] },
          utilisateur.id,
        );

        // Then
        await expect(
          tx.evaluation_objectif.findUniqueOrThrow({
            where: { id: evalObjInstruction.id },
          }),
        ).resolves.toEqual(expect.objectContaining({ note: 4 }));

        await expect(
          tx.evaluation_critere.findUniqueOrThrow({
            where: { id: evalCritInstruction.id },
          }),
        ).resolves.toEqual(expect.objectContaining({ note: 3 }));
      }),
    );

    it(
      "doit ignorer les évaluations qui ont déjà des notes en instruction",
      createIntegrationTest(async (tx) => {
        // Given
        const utilisateur = await fixtures.utilisateur();
        const rattachement = await fixtures.rattachement();
        const objectif = await fixtures.objectif({
          rattachement_code: rattachement.code,
          libelle: "Objectif avec notes",
        });

        const fiche = await fixtures.fiche({
          rattachement_code: rattachement.code,
          etape_courante: "CONSOLIDATION",
        });

        const etapeConsolidation = await fixtures.etapeEvaluation({
          fiche_evaluation_id: fiche.id,
          type: "CONSOLIDATION",
        });

        await fixtures.evaluationObjectif({
          etape_evaluation_id: etapeConsolidation.id,
          objectif_id: objectif.id,
          auteur_id: utilisateur.id,
          note: 4,
          commentaire: "Note consolidation",
        });

        // INSTRUCTION step with existing note
        const etapeInstruction = await fixtures.etapeEvaluation({
          fiche_evaluation_id: fiche.id,
          type: "INSTRUCTION",
        });

        const evalObjInstruction = await fixtures.evaluationObjectif({
          etape_evaluation_id: etapeInstruction.id,
          objectif_id: objectif.id,
          auteur_id: utilisateur.id,
          note: 2,
          commentaire: "Note déjà présente",
        });

        // When
        await handler.execute(
          { ficheEvaluationIds: [fiche.id] },
          utilisateur.id,
        );

        // Then
        await expect(
          tx.evaluation_objectif.findUniqueOrThrow({
            where: { id: evalObjInstruction.id },
          }),
        ).resolves.toEqual(
          expect.objectContaining({
            note: 2,
            commentaire: "Note déjà présente",
          }),
        );
      }),
    );

    it(
      "doit réinitialiser date_traitement si la note a changé entre consolidation et instruction",
      createIntegrationTest(async (tx) => {
        // Given
        const utilisateur = await fixtures.utilisateur();
        const rattachement = await fixtures.rattachement();
        const objectif = await fixtures.objectif({
          rattachement_code: rattachement.code,
          libelle: "Objectif date traitement",
        });
        const critere = await fixtures.critere({
          libelle: "Critère date traitement",
        });
        const dateTraitement = new Date("2025-01-01");

        const fiche = await fixtures.fiche({
          rattachement_code: rattachement.code,
          etape_courante: "CONSOLIDATION",
        });

        const etapeConsolidation = await fixtures.etapeEvaluation({
          fiche_evaluation_id: fiche.id,
          type: "CONSOLIDATION",
        });

        await fixtures.evaluationObjectif({
          etape_evaluation_id: etapeConsolidation.id,
          objectif_id: objectif.id,
          auteur_id: utilisateur.id,
          note: 4,
          commentaire: "Note consolidation",
        });

        await fixtures.evaluationCritere({
          etape_evaluation_id: etapeConsolidation.id,
          critere_id: critere.id,
          auteur_id: utilisateur.id,
          note: 3,
          commentaire: "Critère consolidation",
        });

        // INSTRUCTION step with different notes and date_traitement set
        const etapeInstruction = await fixtures.etapeEvaluation({
          fiche_evaluation_id: fiche.id,
          type: "INSTRUCTION",
        });

        const evalObjInstruction = await fixtures.evaluationObjectif({
          etape_evaluation_id: etapeInstruction.id,
          objectif_id: objectif.id,
          auteur_id: utilisateur.id,
          note: 2,
          commentaire: "Note instruction différente",
          date_traitement: dateTraitement,
        });

        const evalCritInstruction = await fixtures.evaluationCritere({
          etape_evaluation_id: etapeInstruction.id,
          critere_id: critere.id,
          auteur_id: utilisateur.id,
          note: 1,
          commentaire: "Critère instruction différent",
          date_traitement: dateTraitement,
        });

        // When
        await handler.execute(
          { ficheEvaluationIds: [fiche.id] },
          utilisateur.id,
        );

        // Then
        await expect(
          tx.evaluation_objectif.findUniqueOrThrow({
            where: { id: evalObjInstruction.id },
          }),
        ).resolves.toEqual(
          expect.objectContaining({
            note: 2,
            date_traitement: null,
          }),
        );

        await expect(
          tx.evaluation_critere.findUniqueOrThrow({
            where: { id: evalCritInstruction.id },
          }),
        ).resolves.toEqual(
          expect.objectContaining({
            note: 1,
            date_traitement: null,
          }),
        );
      }),
    );

    it(
      "doit créer l'évaluation d'objectif manquante si elle n'existe pas en instruction",
      createIntegrationTest(async (tx) => {
        // Given
        const utilisateur = await fixtures.utilisateur();
        const rattachement = await fixtures.rattachement();
        const objectif1 = await fixtures.objectif({
          rattachement_code: rattachement.code,
          libelle: "Objectif 1",
        });
        const objectif2 = await fixtures.objectif({
          rattachement_code: rattachement.code,
          libelle: "Objectif 2",
        });

        const fiche = await fixtures.fiche({
          rattachement_code: rattachement.code,
          etape_courante: "CONSOLIDATION",
        });

        const etapeConsolidation = await fixtures.etapeEvaluation({
          fiche_evaluation_id: fiche.id,
          type: "CONSOLIDATION",
        });

        await fixtures.evaluationObjectif({
          etape_evaluation_id: etapeConsolidation.id,
          objectif_id: objectif1.id,
          auteur_id: utilisateur.id,
          note: 3,
          commentaire: "Objectif 1 consolidé",
        });

        await fixtures.evaluationObjectif({
          etape_evaluation_id: etapeConsolidation.id,
          objectif_id: objectif2.id,
          auteur_id: utilisateur.id,
          note: 4,
          commentaire: "Objectif 2 consolidé",
        });

        // INSTRUCTION step with only objectif1 (objectif2 is missing)
        const etapeInstruction = await fixtures.etapeEvaluation({
          fiche_evaluation_id: fiche.id,
          type: "INSTRUCTION",
        });

        await fixtures.evaluationObjectif({
          etape_evaluation_id: etapeInstruction.id,
          objectif_id: objectif1.id,
          auteur_id: utilisateur.id,
          note: null,
          commentaire: "",
        });

        // When
        await handler.execute(
          { ficheEvaluationIds: [fiche.id] },
          utilisateur.id,
        );

        // Then
        const evaluationsObjectifs = await tx.evaluation_objectif.findMany({
          where: {
            etape_evaluation_id: etapeInstruction.id,
          },
          orderBy: { note: "asc" },
        });

        expect(evaluationsObjectifs).toEqual([
          expect.objectContaining({
            objectif_id: objectif1.id,
            auteur_id: utilisateur.id,
            note: 3,
          }),
          expect.objectContaining({
            objectif_id: objectif2.id,
            auteur_id: utilisateur.id,
            note: 4,
            commentaire: "",
          }),
        ]);
      }),
    );

    it(
      "doit créer l'évaluation de critère manquante si elle n'existe pas en instruction",
      createIntegrationTest(async (tx) => {
        // Given
        const utilisateur = await fixtures.utilisateur();
        const critere1 = await fixtures.critere({ libelle: "Critère 1" });
        const critere2 = await fixtures.critere({ libelle: "Critère 2" });

        const fiche = await fixtures.fiche({
          etape_courante: "CONSOLIDATION",
        });

        const etapeConsolidation = await fixtures.etapeEvaluation({
          fiche_evaluation_id: fiche.id,
          type: "CONSOLIDATION",
        });

        await fixtures.evaluationCritere({
          etape_evaluation_id: etapeConsolidation.id,
          critere_id: critere1.id,
          auteur_id: utilisateur.id,
          note: 2,
          commentaire: "Critère 1 consolidé",
        });

        await fixtures.evaluationCritere({
          etape_evaluation_id: etapeConsolidation.id,
          critere_id: critere2.id,
          auteur_id: utilisateur.id,
          note: 5,
          commentaire: "Critère 2 consolidé",
        });

        // INSTRUCTION step with only critere1 (critere2 is missing)
        const etapeInstruction = await fixtures.etapeEvaluation({
          fiche_evaluation_id: fiche.id,
          type: "INSTRUCTION",
        });

        await fixtures.evaluationCritere({
          etape_evaluation_id: etapeInstruction.id,
          critere_id: critere1.id,
          auteur_id: utilisateur.id,
          note: null,
          commentaire: "",
        });

        // When
        await handler.execute(
          { ficheEvaluationIds: [fiche.id] },
          utilisateur.id,
        );

        // Then
        const evaluationsCriteres = await tx.evaluation_critere.findMany({
          where: {
            etape_evaluation_id: etapeInstruction.id,
          },
          orderBy: { note: "asc" },
        });

        expect(evaluationsCriteres).toEqual([
          expect.objectContaining({
            critere_id: critere1.id,
            auteur_id: utilisateur.id,
            note: 2,
          }),
          expect.objectContaining({
            critere_id: critere2.id,
            auteur_id: utilisateur.id,
            note: 5,
            commentaire: "",
          }),
        ]);
      }),
    );
  });
});
