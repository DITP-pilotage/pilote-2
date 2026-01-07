import { PasserALaConsolidationHandler } from "@/server/evaluation/handlers/PasserALaConsolidationHandler";
import { PrismaPilote } from "@/server/db/PrismaPilote";
import { InMemoryTransaction } from "@/server/db/InMemoryTransaction";
import { SoumettreEtapeEvaluationService } from "@/server/evaluation/services/SoumettreEtapeEvaluationService";
import { createIntegrationTest } from "@/server/infrastructure/test/createIntegrationTest";
import { fixtures } from "@/server/infrastructure/test/fixtures";

describe("PasserALaConsolidationHandler", () => {
  let handler: PasserALaConsolidationHandler;
  const prismaPilote = new PrismaPilote();
  const transaction = new InMemoryTransaction();
  const soumettreEtapeEvaluationService = new SoumettreEtapeEvaluationService({
    transaction,
    prisma: prismaPilote,
  });

  beforeEach(() => {
    handler = new PasserALaConsolidationHandler({
      transaction,
      soumettreEtapeEvaluationService: soumettreEtapeEvaluationService,
    });
  });

  describe("#execute", () => {
    it(
      "doit échouer si la fiche n'est pas en étape AUTO_EVALUATION",
      createIntegrationTest(async () => {
        // Given
        const utilisateur = await fixtures.utilisateur();
        const fiche = await fixtures.fiche({
          etape_courante: "CONSOLIDATION",
        });
        await fixtures.evaluation({
          fiche_evaluation_id: fiche.id,
          type: "AUTO_EVALUATION",
        });

        // When/Then
        await expect(
          handler.execute({ ficheEvaluationIds: [fiche.id] }, utilisateur.id),
        ).rejects.toThrow();
      }),
    );

    it(
      "doit créer une étape CONSOLIDATION avec les évaluations clonées sans les commentaires",
      createIntegrationTest(async (tx) => {
        // Given
        const auteurInitial = await fixtures.utilisateur();
        const nouvelAuteur = await fixtures.utilisateur();

        const rattachement = await fixtures.rattachement();
        const objectif = await fixtures.objectif({
          rattachement_code: rattachement.code,
          libelle: "Objectif consolidation",
        });
        const critere = await fixtures.critere({
          libelle: "Critère consolidation",
        });

        const fiche = await fixtures.fiche({
          rattachement_code: rattachement.code,
          etape_courante: "AUTO_EVALUATION",
        });

        const etapeAutoEvaluation = await fixtures.evaluation({
          fiche_evaluation_id: fiche.id,
          type: "AUTO_EVALUATION",
        });

        const evalObjAutoEval = await fixtures.evaluationObjectif({
          etape_evaluation_id: etapeAutoEvaluation.id,
          objectif_id: objectif.id,
          auteur_id: auteurInitial.id,
          note: 4,
          commentaire: "Objectif auto-évalué",
        });

        const evalCritAutoEval = await fixtures.evaluationCritere({
          etape_evaluation_id: etapeAutoEvaluation.id,
          critere_id: critere.id,
          auteur_id: auteurInitial.id,
          note: 3,
          commentaire: "Critère auto-évalué",
        });

        // When
        await handler.execute(
          { ficheEvaluationIds: [fiche.id] },
          nouvelAuteur.id,
        );

        // Then
        const etapeConsolidation = await tx.etape_evaluation.findFirstOrThrow({
          where: {
            fiche_evaluation_id: fiche.id,
            type: "CONSOLIDATION",
          },
          include: {
            evaluations_objectifs: true,
            evaluations_criteres: true,
          },
        });

        expect(etapeConsolidation.evaluations_objectifs).toEqual([
          expect.objectContaining({
            objectif_id: objectif.id,
            auteur_id: nouvelAuteur.id,
            note: 4,
            commentaire: "",
          }),
        ]);
        expect(etapeConsolidation.evaluations_objectifs.at(0)?.id).not.toBe(
          evalObjAutoEval.id,
        );

        expect(etapeConsolidation.evaluations_criteres).toEqual([
          expect.objectContaining({
            critere_id: critere.id,
            auteur_id: nouvelAuteur.id,
            note: 3,
            commentaire: "",
          }),
        ]);
        expect(etapeConsolidation.evaluations_criteres.at(0)?.id).not.toBe(
          evalCritAutoEval.id,
        );

        const ficheEvaluation = await tx.fiche_evaluation.findUniqueOrThrow({
          where: { id: fiche.id },
        });
        expect(ficheEvaluation.etape_courante).toBe("CONSOLIDATION");
      }),
    );

    it(
      "doit traiter plusieurs fiches en une seule transaction",
      createIntegrationTest(async (tx) => {
        // Given
        const utilisateur = await fixtures.utilisateur();

        const fiche1 = await fixtures.fiche({
          etape_courante: "AUTO_EVALUATION",
        });
        const fiche2 = await fixtures.fiche({
          etape_courante: "AUTO_EVALUATION",
        });

        await fixtures.evaluation({
          fiche_evaluation_id: fiche1.id,
          type: "AUTO_EVALUATION",
        });
        await fixtures.evaluation({
          fiche_evaluation_id: fiche2.id,
          type: "AUTO_EVALUATION",
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
            (fiche) => fiche.etape_courante === "CONSOLIDATION",
          ),
        ).toBe(true);

        const etapesConsolidation = await tx.etape_evaluation.findMany({
          where: {
            fiche_evaluation_id: { in: [fiche1.id, fiche2.id] },
            type: "CONSOLIDATION",
          },
        });

        expect(etapesConsolidation).toHaveLength(2);
      }),
    );

    it(
      "ne doit pas recréer une étape CONSOLIDATION si elle existe déjà",
      createIntegrationTest(async (tx) => {
        // Given - fiche qui est revenue en AUTO_EVALUATION après avoir été en CONSOLIDATION
        const utilisateur = await fixtures.utilisateur();
        const rattachement = await fixtures.rattachement();
        const objectif = await fixtures.objectif({
          rattachement_code: rattachement.code,
          libelle: "Objectif existing",
        });

        const fiche = await fixtures.fiche({
          rattachement_code: rattachement.code,
          etape_courante: "AUTO_EVALUATION",
        });

        const etapeAutoEvaluation = await fixtures.evaluation({
          fiche_evaluation_id: fiche.id,
          type: "AUTO_EVALUATION",
        });

        await fixtures.evaluationObjectif({
          etape_evaluation_id: etapeAutoEvaluation.id,
          objectif_id: objectif.id,
          auteur_id: utilisateur.id,
          note: 5,
          commentaire: "Auto-évalué",
        });

        // Existing CONSOLIDATION step
        const etapeConsolidationExistante = await fixtures.evaluation({
          fiche_evaluation_id: fiche.id,
          type: "CONSOLIDATION",
        });

        const evalObjConsolidationExistante = await fixtures.evaluationObjectif(
          {
            etape_evaluation_id: etapeConsolidationExistante.id,
            objectif_id: objectif.id,
            auteur_id: utilisateur.id,
            note: 4,
            commentaire: "Consolidé précédemment",
          },
        );

        // When
        await handler.execute(
          { ficheEvaluationIds: [fiche.id] },
          utilisateur.id,
        );

        // Then - should only have one CONSOLIDATION step (the existing one)
        const etapesConsolidation = await tx.etape_evaluation.findMany({
          where: {
            fiche_evaluation_id: fiche.id,
            type: "CONSOLIDATION",
          },
          include: {
            evaluations_objectifs: true,
          },
        });

        expect(etapesConsolidation).toHaveLength(1);
        expect(etapesConsolidation[0].id).toBe(etapeConsolidationExistante.id);
        expect(etapesConsolidation[0].evaluations_objectifs).toEqual([
          expect.objectContaining({
            id: evalObjConsolidationExistante.id,
            note: 4,
            commentaire: "Consolidé précédemment",
          }),
        ]);

        const ficheEvaluation = await tx.fiche_evaluation.findUniqueOrThrow({
          where: { id: fiche.id },
        });
        expect(ficheEvaluation.etape_courante).toBe("CONSOLIDATION");
      }),
    );

    it(
      "doit copier la note auto-évaluation vers consolidation si consolidation note est vide",
      createIntegrationTest(async (tx) => {
        // Given
        const utilisateur = await fixtures.utilisateur();
        const rattachement = await fixtures.rattachement();
        const objectif = await fixtures.objectif({
          rattachement_code: rattachement.code,
          libelle: "Objectif copy",
        });
        const critere = await fixtures.critere({ libelle: "Critère copy" });

        const fiche = await fixtures.fiche({
          rattachement_code: rattachement.code,
          etape_courante: "AUTO_EVALUATION",
        });

        const etapeAutoEvaluation = await fixtures.evaluation({
          fiche_evaluation_id: fiche.id,
          type: "AUTO_EVALUATION",
        });

        await fixtures.evaluationObjectif({
          etape_evaluation_id: etapeAutoEvaluation.id,
          objectif_id: objectif.id,
          auteur_id: utilisateur.id,
          note: 80,
          commentaire: "Auto-évalué",
        });

        await fixtures.evaluationCritere({
          etape_evaluation_id: etapeAutoEvaluation.id,
          critere_id: critere.id,
          auteur_id: utilisateur.id,
          note: 70,
          commentaire: "Auto-évalué critère",
        });

        // Existing CONSOLIDATION with null notes
        const etapeConsolidation = await fixtures.evaluation({
          fiche_evaluation_id: fiche.id,
          type: "CONSOLIDATION",
        });

        const evalObjConsolidation = await fixtures.evaluationObjectif({
          etape_evaluation_id: etapeConsolidation.id,
          objectif_id: objectif.id,
          auteur_id: utilisateur.id,
          note: null,
          commentaire: "",
        });

        const evalCritConsolidation = await fixtures.evaluationCritere({
          etape_evaluation_id: etapeConsolidation.id,
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
        const evalObjectif = await tx.evaluation_objectif.findUniqueOrThrow({
          where: { id: evalObjConsolidation.id },
        });
        expect(evalObjectif.note).toBe(80);

        const evalCritere = await tx.evaluation_critere.findUniqueOrThrow({
          where: { id: evalCritConsolidation.id },
        });
        expect(evalCritere.note).toBe(70);
      }),
    );

    it(
      "ne doit pas écraser la note consolidation si elle existe déjà",
      createIntegrationTest(async (tx) => {
        // Given
        const utilisateur = await fixtures.utilisateur();
        const rattachement = await fixtures.rattachement();
        const objectif = await fixtures.objectif({
          rattachement_code: rattachement.code,
          libelle: "Objectif keep",
        });
        const critere = await fixtures.critere({ libelle: "Critère keep" });

        const fiche = await fixtures.fiche({
          rattachement_code: rattachement.code,
          etape_courante: "AUTO_EVALUATION",
        });

        const etapeAutoEvaluation = await fixtures.evaluation({
          fiche_evaluation_id: fiche.id,
          type: "AUTO_EVALUATION",
        });

        await fixtures.evaluationObjectif({
          etape_evaluation_id: etapeAutoEvaluation.id,
          objectif_id: objectif.id,
          auteur_id: utilisateur.id,
          note: 90,
          commentaire: "Auto-évalué",
        });

        await fixtures.evaluationCritere({
          etape_evaluation_id: etapeAutoEvaluation.id,
          critere_id: critere.id,
          auteur_id: utilisateur.id,
          note: 85,
          commentaire: "Auto-évalué critère",
        });

        // Existing CONSOLIDATION with existing notes
        const etapeConsolidation = await fixtures.evaluation({
          fiche_evaluation_id: fiche.id,
          type: "CONSOLIDATION",
        });

        const evalObjConsolidation = await fixtures.evaluationObjectif({
          etape_evaluation_id: etapeConsolidation.id,
          objectif_id: objectif.id,
          auteur_id: utilisateur.id,
          note: 60,
          commentaire: "Consolidé",
        });

        const evalCritConsolidation = await fixtures.evaluationCritere({
          etape_evaluation_id: etapeConsolidation.id,
          critere_id: critere.id,
          auteur_id: utilisateur.id,
          note: 55,
          commentaire: "Consolidé critère",
        });

        // When
        await handler.execute(
          { ficheEvaluationIds: [fiche.id] },
          utilisateur.id,
        );

        // Then
        const evalObjectif = await tx.evaluation_objectif.findUniqueOrThrow({
          where: { id: evalObjConsolidation.id },
        });
        expect(evalObjectif.note).toBe(60);

        const evalCritere = await tx.evaluation_critere.findUniqueOrThrow({
          where: { id: evalCritConsolidation.id },
        });
        expect(evalCritere.note).toBe(55);
      }),
    );

    it(
      "doit réinitialiser date_traitement si la note auto-évaluation diffère de consolidation",
      createIntegrationTest(async (tx) => {
        // Given
        const utilisateur = await fixtures.utilisateur();
        const rattachement = await fixtures.rattachement();
        const objectif = await fixtures.objectif({
          rattachement_code: rattachement.code,
          libelle: "Objectif reset",
        });
        const critere = await fixtures.critere({ libelle: "Critère reset" });
        const dateTraitement = new Date("2025-01-15");

        const fiche = await fixtures.fiche({
          rattachement_code: rattachement.code,
          etape_courante: "AUTO_EVALUATION",
        });

        const etapeAutoEvaluation = await fixtures.evaluation({
          fiche_evaluation_id: fiche.id,
          type: "AUTO_EVALUATION",
        });

        await fixtures.evaluationObjectif({
          etape_evaluation_id: etapeAutoEvaluation.id,
          objectif_id: objectif.id,
          auteur_id: utilisateur.id,
          note: 85,
          commentaire: "Auto-évalué modifié",
        });

        await fixtures.evaluationCritere({
          etape_evaluation_id: etapeAutoEvaluation.id,
          critere_id: critere.id,
          auteur_id: utilisateur.id,
          note: 75,
          commentaire: "Auto-évalué critère modifié",
        });

        // Existing CONSOLIDATION with different notes and date_traitement set
        const etapeConsolidation = await fixtures.evaluation({
          fiche_evaluation_id: fiche.id,
          type: "CONSOLIDATION",
        });

        const evalObjConsolidation = await fixtures.evaluationObjectif({
          etape_evaluation_id: etapeConsolidation.id,
          objectif_id: objectif.id,
          auteur_id: utilisateur.id,
          note: 50,
          commentaire: "Consolidé",
          date_traitement: dateTraitement,
        });

        const evalCritConsolidation = await fixtures.evaluationCritere({
          etape_evaluation_id: etapeConsolidation.id,
          critere_id: critere.id,
          auteur_id: utilisateur.id,
          note: 40,
          commentaire: "Consolidé critère",
          date_traitement: dateTraitement,
        });

        // When
        await handler.execute(
          { ficheEvaluationIds: [fiche.id] },
          utilisateur.id,
        );

        // Then
        const evalObjectif = await tx.evaluation_objectif.findUniqueOrThrow({
          where: { id: evalObjConsolidation.id },
        });
        expect(evalObjectif.note).toBe(50);
        expect(evalObjectif.date_traitement).toBeNull();

        const evalCritere = await tx.evaluation_critere.findUniqueOrThrow({
          where: { id: evalCritConsolidation.id },
        });
        expect(evalCritere.note).toBe(40);
        expect(evalCritere.date_traitement).toBeNull();
      }),
    );

    it(
      "ne doit pas réinitialiser date_traitement si les notes sont identiques",
      createIntegrationTest(async (tx) => {
        // Given
        const utilisateur = await fixtures.utilisateur();
        const rattachement = await fixtures.rattachement();
        const objectif = await fixtures.objectif({
          rattachement_code: rattachement.code,
          libelle: "Objectif same",
        });
        const dateTraitement = new Date("2025-01-15");

        const fiche = await fixtures.fiche({
          rattachement_code: rattachement.code,
          etape_courante: "AUTO_EVALUATION",
        });

        const etapeAutoEvaluation = await fixtures.evaluation({
          fiche_evaluation_id: fiche.id,
          type: "AUTO_EVALUATION",
        });

        await fixtures.evaluationObjectif({
          etape_evaluation_id: etapeAutoEvaluation.id,
          objectif_id: objectif.id,
          auteur_id: utilisateur.id,
          note: 50,
          commentaire: "Auto-évalué",
        });

        // Existing CONSOLIDATION with same note and date_traitement set
        const etapeConsolidation = await fixtures.evaluation({
          fiche_evaluation_id: fiche.id,
          type: "CONSOLIDATION",
        });

        const evalObjConsolidation = await fixtures.evaluationObjectif({
          etape_evaluation_id: etapeConsolidation.id,
          objectif_id: objectif.id,
          auteur_id: utilisateur.id,
          note: 50,
          commentaire: "Consolidé",
          date_traitement: dateTraitement,
        });

        // When
        await handler.execute(
          { ficheEvaluationIds: [fiche.id] },
          utilisateur.id,
        );

        // Then
        const evalObjectif = await tx.evaluation_objectif.findUniqueOrThrow({
          where: { id: evalObjConsolidation.id },
        });
        expect(evalObjectif.note).toBe(50);
        expect(evalObjectif.date_traitement).toEqual(dateTraitement);
      }),
    );

    it(
      "ne doit pas réinitialiser date_traitement si date_traitement est null",
      createIntegrationTest(async (tx) => {
        // Given
        const utilisateur = await fixtures.utilisateur();
        const rattachement = await fixtures.rattachement();
        const objectif = await fixtures.objectif({
          rattachement_code: rattachement.code,
          libelle: "Objectif no date",
        });

        const fiche = await fixtures.fiche({
          rattachement_code: rattachement.code,
          etape_courante: "AUTO_EVALUATION",
        });

        const etapeAutoEvaluation = await fixtures.evaluation({
          fiche_evaluation_id: fiche.id,
          type: "AUTO_EVALUATION",
        });

        await fixtures.evaluationObjectif({
          etape_evaluation_id: etapeAutoEvaluation.id,
          objectif_id: objectif.id,
          auteur_id: utilisateur.id,
          note: 80,
          commentaire: "Auto-évalué",
        });

        // Existing CONSOLIDATION with different note and date_traitement null
        const etapeConsolidation = await fixtures.evaluation({
          fiche_evaluation_id: fiche.id,
          type: "CONSOLIDATION",
        });

        const evalObjConsolidation = await fixtures.evaluationObjectif({
          etape_evaluation_id: etapeConsolidation.id,
          objectif_id: objectif.id,
          auteur_id: utilisateur.id,
          note: 60,
          commentaire: "Consolidé",
          date_traitement: null,
        });

        // When
        await handler.execute(
          { ficheEvaluationIds: [fiche.id] },
          utilisateur.id,
        );

        // Then
        const evalObjectif = await tx.evaluation_objectif.findUniqueOrThrow({
          where: { id: evalObjConsolidation.id },
        });
        expect(evalObjectif.note).toBe(60);
        expect(evalObjectif.date_traitement).toBeNull();
      }),
    );
  });
});
