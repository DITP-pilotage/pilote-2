import { PasserALaConsolidationHandler } from "@/server/evaluation/handlers/PasserALaConsolidationHandler";
import { PrismaPilote } from "@/server/db/PrismaPilote";
import { prisma } from "@/server/db/prisma";
import { PrismaTransaction } from "@/server/db/PrismaTransaction";
import { SoumettreAutoEvaluationService } from "@/server/evaluation/services/SoumettreAutoEvaluationService";

describe("PasserALaConsolidationHandler", () => {
  let handler: PasserALaConsolidationHandler;
  const prismaPilote = new PrismaPilote();
  const transaction = new PrismaTransaction();
  const soumettreAutoEvaluationService = new SoumettreAutoEvaluationService({
    transaction,
    prisma: prismaPilote,
  });

  beforeEach(() => {
    handler = new PasserALaConsolidationHandler({
      transaction,
      soumettreAutoEvaluationService,
    });
  });

  describe("#execute", () => {
    it("doit échouer si la fiche n'est pas en étape AUTO_EVALUATION", async () => {
      // Given
      const rattachementCode = "REG-500";
      const ficheEvaluationId = "a1b2c3d4-5e6f-7a8b-9c0d-1e2f3a4b5c6d";
      const utilisateurId = "b2c3d4e5-6f7a-8b9c-0d1e-2f3a4b5c6d7e";

      await prisma.utilisateur.create({
        data: {
          id: utilisateurId,
          email: "test.consolidation1@example.com",
          nom: "Consolidation",
          prenom: "Test1",
          date_creation: new Date(),
          profilCode: "DITP_ADMIN",
        },
      });

      await prisma.referentiel_rattachement.create({
        data: {
          code: rattachementCode,
          groupe: rattachementCode,
          ordre: 1,
          libelle: "Rattachement consolidation test",
        },
      });

      await prisma.fiche_evaluation.create({
        data: {
          id: ficheEvaluationId,
          jalon: 2025,
          etape_courante: "CONSOLIDATION",
          rattachement_code: rattachementCode,
          etape_evaluations: {
            create: {
              id: "c3d4e5f6-7a8b-9c0d-1e2f-3a4b5c6d7e8f",
              type: "AUTO_EVALUATION",
            },
          },
        },
      });

      // When/Then
      await expect(
        handler.execute(
          { ficheEvaluationIds: [ficheEvaluationId] },
          utilisateurId,
        ),
      ).rejects.toThrow();
    });

    it("doit créer une étape CONSOLIDATION avec les évaluations clonées sans les commentaires", async () => {
      // Given
      const rattachementCode = "REG-501";
      const ficheEvaluationId = "d4e5f6a7-8b9c-0d1e-2f3a-4b5c6d7e8f9a";
      const etapeAutoEvaluationId = "e5f6a7b8-9c0d-1e2f-3a4b-5c6d7e8f9a0b";
      const utilisateurId = "f6a7b8c9-0d1e-2f3a-4b5c-6d7e8f9a0b1c";
      const nouvelAuteurId = "a7b8c9d0-1e2f-3a4b-5c6d-7e8f9a0b1c2d";
      const objectifId = "b8c9d0e1-2f3a-4b5c-6d7e-8f9a0b1c2d3e";
      const critereId = "c9d0e1f2-3a4b-5c6d-7e8f-9a0b1c2d3e4f";
      const sousCritereId = "d0e1f2a3-4b5c-6d7e-8f9a-0b1c2d3e4f5a";
      const evaluationObjectifId = "e1f2a3b4-5c6d-7e8f-9a0b-1c2d3e4f5a6b";
      const evaluationCritereId = "f2a3b4c5-6d7e-8f9a-0b1c-2d3e4f5a6b7c";

      await prisma.utilisateur.createMany({
        data: [
          {
            id: utilisateurId,
            email: "test.consolidation2@example.com",
            nom: "Consolidation",
            prenom: "Test2",
            date_creation: new Date(),
            profilCode: "DITP_ADMIN",
          },
          {
            id: nouvelAuteurId,
            email: "test.consolidation2b@example.com",
            nom: "Consolidation",
            prenom: "Test2b",
            date_creation: new Date(),
            profilCode: "DITP_ADMIN",
          },
        ],
      });

      await prisma.referentiel_critere.create({
        data: {
          id: critereId,
          libelle: "Critère consolidation",
          descriptif: "Description",
          sous_criteres: {
            create: {
              id: sousCritereId,
              libelle: "Sous-critère consolidation",
              descriptif: "Description",
            },
          },
        },
      });

      await prisma.referentiel_rattachement.create({
        data: {
          code: rattachementCode,
          groupe: rattachementCode,
          ordre: 1,
          libelle: "Rattachement consolidation clone",
          objectifs: {
            create: {
              id: objectifId,
              libelle: "Objectif consolidation",
              descriptif: "Description",
              jalon: 2025,
            },
          },
        },
      });

      await prisma.fiche_evaluation.create({
        data: {
          id: ficheEvaluationId,
          jalon: 2025,
          etape_courante: "AUTO_EVALUATION",
          rattachement_code: rattachementCode,
          etape_evaluations: {
            create: {
              id: etapeAutoEvaluationId,
              type: "AUTO_EVALUATION",
              evaluations_objectifs: {
                create: {
                  id: evaluationObjectifId,
                  objectif_id: objectifId,
                  auteur_id: utilisateurId,
                  note: 4,
                  commentaire: "Objectif auto-évalué",
                },
              },
              evaluations_criteres: {
                create: {
                  id: evaluationCritereId,
                  critere_id: critereId,
                  auteur_id: utilisateurId,
                  note: 3,
                  commentaire: "Critère auto-évalué",
                },
              },
            },
          },
        },
      });

      // When
      await handler.execute(
        { ficheEvaluationIds: [ficheEvaluationId] },
        nouvelAuteurId,
      );

      // Then
      const etapeConsolidation = await prisma.etape_evaluation.findFirstOrThrow(
        {
          where: {
            fiche_evaluation_id: ficheEvaluationId,
            type: "CONSOLIDATION",
          },
          include: {
            evaluations_objectifs: true,
            evaluations_criteres: true,
          },
        },
      );

      expect(etapeConsolidation.evaluations_objectifs).toEqual([
        expect.objectContaining({
          objectif_id: objectifId,
          auteur_id: nouvelAuteurId,
          note: 4,
          commentaire: "",
        }),
      ]);
      expect(etapeConsolidation.evaluations_objectifs.at(0)?.id).not.toBe(
        evaluationObjectifId,
      );

      expect(etapeConsolidation.evaluations_criteres).toEqual([
        expect.objectContaining({
          critere_id: critereId,
          auteur_id: nouvelAuteurId,
          note: 3,
          commentaire: "",
        }),
      ]);
      expect(etapeConsolidation.evaluations_criteres.at(0)?.id).not.toBe(
        evaluationCritereId,
      );

      const ficheEvaluation = await prisma.fiche_evaluation.findUniqueOrThrow({
        where: { id: ficheEvaluationId },
      });
      expect(ficheEvaluation.etape_courante).toBe("CONSOLIDATION");
    });

    it("doit traiter plusieurs fiches en une seule transaction", async () => {
      // Given
      const rattachementCode = "REG-502";
      const rattachementCode2 = "REG-503";
      const ficheEvaluationId1 = "a3b4c5d6-7e8f-9a0b-1c2d-3e4f5a6b7c8d";
      const ficheEvaluationId2 = "b4c5d6e7-8f9a-0b1c-2d3e-4f5a6b7c8d9e";
      const etapeAutoEvaluationId1 = "c5d6e7f8-9a0b-1c2d-3e4f-5a6b7c8d9e0f";
      const etapeAutoEvaluationId2 = "d6e7f8a9-0b1c-2d3e-4f5a-6b7c8d9e0f1a";
      const utilisateurId = "e7f8a9b0-1c2d-3e4f-5a6b-7c8d9e0f1a2b";

      await prisma.utilisateur.create({
        data: {
          id: utilisateurId,
          email: "test.consolidation3@example.com",
          nom: "Consolidation",
          prenom: "Test3",
          date_creation: new Date(),
          profilCode: "DITP_ADMIN",
        },
      });

      await prisma.referentiel_rattachement.create({
        data: {
          code: rattachementCode,
          groupe: rattachementCode,
          ordre: 1,
          libelle: "Rattachement consolidation multiple",
        },
      });

      await prisma.referentiel_rattachement.create({
        data: {
          code: rattachementCode2,
          groupe: rattachementCode2,
          ordre: 1,
          libelle: "Rattachement consolidation multiple 2",
        },
      });

      await prisma.fiche_evaluation.createMany({
        data: [
          {
            id: ficheEvaluationId1,
            jalon: 2025,
            etape_courante: "AUTO_EVALUATION",
            rattachement_code: rattachementCode,
          },
          {
            id: ficheEvaluationId2,
            jalon: 2025,
            etape_courante: "AUTO_EVALUATION",
            rattachement_code: rattachementCode2,
          },
        ],
      });

      await prisma.etape_evaluation.createMany({
        data: [
          {
            id: etapeAutoEvaluationId1,
            type: "AUTO_EVALUATION",
            fiche_evaluation_id: ficheEvaluationId1,
          },
          {
            id: etapeAutoEvaluationId2,
            type: "AUTO_EVALUATION",
            fiche_evaluation_id: ficheEvaluationId2,
          },
        ],
      });

      // When
      await handler.execute(
        { ficheEvaluationIds: [ficheEvaluationId1, ficheEvaluationId2] },
        utilisateurId,
      );

      // Then
      const fichesEvaluation = await prisma.fiche_evaluation.findMany({
        where: { id: { in: [ficheEvaluationId1, ficheEvaluationId2] } },
      });

      expect(fichesEvaluation).toHaveLength(2);
      expect(
        fichesEvaluation.every(
          (fiche) => fiche.etape_courante === "CONSOLIDATION",
        ),
      ).toBe(true);

      const etapesConsolidation = await prisma.etape_evaluation.findMany({
        where: {
          fiche_evaluation_id: { in: [ficheEvaluationId1, ficheEvaluationId2] },
          type: "CONSOLIDATION",
        },
      });

      expect(etapesConsolidation).toHaveLength(2);
    });

    it("ne doit pas recréer une étape CONSOLIDATION si elle existe déjà", async () => {
      // Given - fiche qui est revenue en AUTO_EVALUATION après avoir été en CONSOLIDATION
      const rattachementCode = "REG-504";
      const ficheEvaluationId = "f8a9b0c1-2d3e-4f5a-6b7c-8d9e0f1a2b3c";
      const etapeAutoEvaluationId = "a9b0c1d2-3e4f-5a6b-7c8d-9e0f1a2b3c4d";
      const existingConsolidationId = "b0c1d2e3-4f5a-6b7c-8d9e-0f1a2b3c4d5e";
      const utilisateurId = "c1d2e3f4-5a6b-7c8d-9e0f-1a2b3c4d5e6f";
      const objectifId = "d2e3f4a5-6b7c-8d9e-0f1a-2b3c4d5e6f7a";
      const existingEvalObjectifId = "e3f4a5b6-7c8d-9e0f-1a2b-3c4d5e6f7a8b";

      await prisma.utilisateur.create({
        data: {
          id: utilisateurId,
          email: "test.consolidation.existing@example.com",
          nom: "Consolidation",
          prenom: "Existing",
          date_creation: new Date(),
          profilCode: "DITP_ADMIN",
        },
      });

      await prisma.referentiel_rattachement.create({
        data: {
          code: rattachementCode,
          groupe: rattachementCode,
          ordre: 1,
          libelle: "Rattachement existing consolidation",
          objectifs: {
            create: {
              id: objectifId,
              libelle: "Objectif existing",
              descriptif: "Description",
              jalon: 2025,
            },
          },
        },
      });

      await prisma.fiche_evaluation.create({
        data: {
          id: ficheEvaluationId,
          jalon: 2025,
          etape_courante: "AUTO_EVALUATION",
          rattachement_code: rattachementCode,
          etape_evaluations: {
            create: [
              {
                id: etapeAutoEvaluationId,
                type: "AUTO_EVALUATION",
                evaluations_objectifs: {
                  create: {
                    id: "f4a5b6c7-8d9e-0f1a-2b3c-4d5e6f7a8b9c",
                    objectif_id: objectifId,
                    auteur_id: utilisateurId,
                    note: 5,
                    commentaire: "Auto-évalué",
                  },
                },
              },
              {
                id: existingConsolidationId,
                type: "CONSOLIDATION",
                evaluations_objectifs: {
                  create: {
                    id: existingEvalObjectifId,
                    objectif_id: objectifId,
                    auteur_id: utilisateurId,
                    note: 4,
                    commentaire: "Consolidé précédemment",
                  },
                },
              },
            ],
          },
        },
      });

      // When
      await handler.execute(
        { ficheEvaluationIds: [ficheEvaluationId] },
        utilisateurId,
      );

      // Then - should only have one CONSOLIDATION step (the existing one)
      const etapesConsolidation = await prisma.etape_evaluation.findMany({
        where: {
          fiche_evaluation_id: ficheEvaluationId,
          type: "CONSOLIDATION",
        },
        include: {
          evaluations_objectifs: true,
        },
      });

      expect(etapesConsolidation).toHaveLength(1);
      expect(etapesConsolidation[0].id).toBe(existingConsolidationId);
      expect(etapesConsolidation[0].evaluations_objectifs).toEqual([
        expect.objectContaining({
          id: existingEvalObjectifId,
          note: 4,
          commentaire: "Consolidé précédemment",
        }),
      ]);

      const ficheEvaluation = await prisma.fiche_evaluation.findUniqueOrThrow({
        where: { id: ficheEvaluationId },
      });
      expect(ficheEvaluation.etape_courante).toBe("CONSOLIDATION");
    });

    it("doit copier la note auto-évaluation vers consolidation si consolidation note est vide", async () => {
      // Given
      const rattachementCode = "REG-505";
      const ficheEvaluationId = "a1b2c3d4-5e6f-7a8b-9c0d-1e2f3a4b5c70";
      const etapeAutoEvaluationId = "b2c3d4e5-6f7a-8b9c-0d1e-2f3a4b5c6d71";
      const existingConsolidationId = "c3d4e5f6-7a8b-9c0d-1e2f-3a4b5c6d7e72";
      const utilisateurId = "d4e5f6a7-8b9c-0d1e-2f3a-4b5c6d7e8f73";
      const objectifId = "e5f6a7b8-9c0d-1e2f-3a4b-5c6d7e8f9a74";
      const critereId = "f6a7b8c9-0d1e-2f3a-4b5c-6d7e8f9a0b75";
      const consolidationEvalObjectifId = "a7b8c9d0-1e2f-3a4b-5c6d-7e8f9a0b1c76";
      const consolidationEvalCritereId = "b8c9d0e1-2f3a-4b5c-6d7e-8f9a0b1c2d77";

      await prisma.utilisateur.create({
        data: {
          id: utilisateurId,
          email: "test.consolidation.copy@example.com",
          nom: "Consolidation",
          prenom: "Copy",
          date_creation: new Date(),
          profilCode: "DITP_ADMIN",
        },
      });

      await prisma.referentiel_critere.create({
        data: {
          id: critereId,
          libelle: "Critère copy",
          descriptif: "Description",
        },
      });

      await prisma.referentiel_rattachement.create({
        data: {
          code: rattachementCode,
          groupe: rattachementCode,
          ordre: 1,
          libelle: "Rattachement copy note",
          objectifs: {
            create: {
              id: objectifId,
              libelle: "Objectif copy",
              descriptif: "Description",
              jalon: 2025,
            },
          },
        },
      });

      await prisma.fiche_evaluation.create({
        data: {
          id: ficheEvaluationId,
          jalon: 2025,
          etape_courante: "AUTO_EVALUATION",
          rattachement_code: rattachementCode,
          etape_evaluations: {
            create: [
              {
                id: etapeAutoEvaluationId,
                type: "AUTO_EVALUATION",
                evaluations_objectifs: {
                  create: {
                    id: "c9d0e1f2-3a4b-5c6d-7e8f-9a0b1c2d3e78",
                    objectif_id: objectifId,
                    auteur_id: utilisateurId,
                    note: 80,
                    commentaire: "Auto-évalué",
                  },
                },
                evaluations_criteres: {
                  create: {
                    id: "d0e1f2a3-4b5c-6d7e-8f9a-0b1c2d3e4f79",
                    critere_id: critereId,
                    auteur_id: utilisateurId,
                    note: 70,
                    commentaire: "Auto-évalué critère",
                  },
                },
              },
              {
                id: existingConsolidationId,
                type: "CONSOLIDATION",
                evaluations_objectifs: {
                  create: {
                    id: consolidationEvalObjectifId,
                    objectif_id: objectifId,
                    auteur_id: utilisateurId,
                    note: null,
                    commentaire: "",
                  },
                },
                evaluations_criteres: {
                  create: {
                    id: consolidationEvalCritereId,
                    critere_id: critereId,
                    auteur_id: utilisateurId,
                    note: null,
                    commentaire: "",
                  },
                },
              },
            ],
          },
        },
      });

      // When
      await handler.execute(
        { ficheEvaluationIds: [ficheEvaluationId] },
        utilisateurId,
      );

      // Then
      const evalObjectif = await prisma.evaluation_objectif.findUniqueOrThrow({
        where: { id: consolidationEvalObjectifId },
      });
      expect(evalObjectif.note).toBe(80);

      const evalCritere = await prisma.evaluation_critere.findUniqueOrThrow({
        where: { id: consolidationEvalCritereId },
      });
      expect(evalCritere.note).toBe(70);
    });

    it("ne doit pas écraser la note consolidation si elle existe déjà", async () => {
      // Given
      const rattachementCode = "REG-506";
      const ficheEvaluationId = "e1f2a3b4-5c6d-7e8f-9a0b-1c2d3e4f5a80";
      const etapeAutoEvaluationId = "f2a3b4c5-6d7e-8f9a-0b1c-2d3e4f5a6b81";
      const existingConsolidationId = "a3b4c5d6-7e8f-9a0b-1c2d-3e4f5a6b7c82";
      const utilisateurId = "b4c5d6e7-8f9a-0b1c-2d3e-4f5a6b7c8d83";
      const objectifId = "c5d6e7f8-9a0b-1c2d-3e4f-5a6b7c8d9e84";
      const critereId = "a1b2c3d4-5e6f-7a8b-9c0d-1e2f3a4b5cb1";
      const consolidationEvalObjectifId = "d6e7f8a9-0b1c-2d3e-4f5a-6b7c8d9e0f85";
      const consolidationEvalCritereId = "b2c3d4e5-6f7a-8b9c-0d1e-2f3a4b5c6db2";

      await prisma.utilisateur.create({
        data: {
          id: utilisateurId,
          email: "test.consolidation.keep@example.com",
          nom: "Consolidation",
          prenom: "Keep",
          date_creation: new Date(),
          profilCode: "DITP_ADMIN",
        },
      });

      await prisma.referentiel_critere.create({
        data: {
          id: critereId,
          libelle: "Critère keep",
          descriptif: "Description",
        },
      });

      await prisma.referentiel_rattachement.create({
        data: {
          code: rattachementCode,
          groupe: rattachementCode,
          ordre: 1,
          libelle: "Rattachement keep note",
          objectifs: {
            create: {
              id: objectifId,
              libelle: "Objectif keep",
              descriptif: "Description",
              jalon: 2025,
            },
          },
        },
      });

      await prisma.fiche_evaluation.create({
        data: {
          id: ficheEvaluationId,
          jalon: 2025,
          etape_courante: "AUTO_EVALUATION",
          rattachement_code: rattachementCode,
          etape_evaluations: {
            create: [
              {
                id: etapeAutoEvaluationId,
                type: "AUTO_EVALUATION",
                evaluations_objectifs: {
                  create: {
                    id: "e7f8a9b0-1c2d-3e4f-5a6b-7c8d9e0f1a86",
                    objectif_id: objectifId,
                    auteur_id: utilisateurId,
                    note: 90,
                    commentaire: "Auto-évalué",
                  },
                },
                evaluations_criteres: {
                  create: {
                    id: "c3d4e5f6-7a8b-9c0d-1e2f-3a4b5c6d7eb3",
                    critere_id: critereId,
                    auteur_id: utilisateurId,
                    note: 85,
                    commentaire: "Auto-évalué critère",
                  },
                },
              },
              {
                id: existingConsolidationId,
                type: "CONSOLIDATION",
                evaluations_objectifs: {
                  create: {
                    id: consolidationEvalObjectifId,
                    objectif_id: objectifId,
                    auteur_id: utilisateurId,
                    note: 60,
                    commentaire: "Consolidé",
                  },
                },
                evaluations_criteres: {
                  create: {
                    id: consolidationEvalCritereId,
                    critere_id: critereId,
                    auteur_id: utilisateurId,
                    note: 55,
                    commentaire: "Consolidé critère",
                  },
                },
              },
            ],
          },
        },
      });

      // When
      await handler.execute(
        { ficheEvaluationIds: [ficheEvaluationId] },
        utilisateurId,
      );

      // Then
      const evalObjectif = await prisma.evaluation_objectif.findUniqueOrThrow({
        where: { id: consolidationEvalObjectifId },
      });
      expect(evalObjectif.note).toBe(60);

      const evalCritere = await prisma.evaluation_critere.findUniqueOrThrow({
        where: { id: consolidationEvalCritereId },
      });
      expect(evalCritere.note).toBe(55);
    });

    it("doit réinitialiser date_traitement si la note auto-évaluation diffère de consolidation", async () => {
      // Given
      const rattachementCode = "REG-507";
      const ficheEvaluationId = "f8a9b0c1-2d3e-4f5a-6b7c-8d9e0f1a2b87";
      const etapeAutoEvaluationId = "a9b0c1d2-3e4f-5a6b-7c8d-9e0f1a2b3c88";
      const existingConsolidationId = "b0c1d2e3-4f5a-6b7c-8d9e-0f1a2b3c4d89";
      const utilisateurId = "c1d2e3f4-5a6b-7c8d-9e0f-1a2b3c4d5e90";
      const objectifId = "d2e3f4a5-6b7c-8d9e-0f1a-2b3c4d5e6f91";
      const critereId = "e3f4a5b6-7c8d-9e0f-1a2b-3c4d5e6f7a92";
      const consolidationEvalObjectifId = "f4a5b6c7-8d9e-0f1a-2b3c-4d5e6f7a8b93";
      const consolidationEvalCritereId = "a5b6c7d8-9e0f-1a2b-3c4d-5e6f7a8b9c94";
      const dateTraitement = new Date("2025-01-15");

      await prisma.utilisateur.create({
        data: {
          id: utilisateurId,
          email: "test.consolidation.reset@example.com",
          nom: "Consolidation",
          prenom: "Reset",
          date_creation: new Date(),
          profilCode: "DITP_ADMIN",
        },
      });

      await prisma.referentiel_critere.create({
        data: {
          id: critereId,
          libelle: "Critère reset",
          descriptif: "Description",
        },
      });

      await prisma.referentiel_rattachement.create({
        data: {
          code: rattachementCode,
          groupe: rattachementCode,
          ordre: 1,
          libelle: "Rattachement reset date",
          objectifs: {
            create: {
              id: objectifId,
              libelle: "Objectif reset",
              descriptif: "Description",
              jalon: 2025,
            },
          },
        },
      });

      await prisma.fiche_evaluation.create({
        data: {
          id: ficheEvaluationId,
          jalon: 2025,
          etape_courante: "AUTO_EVALUATION",
          rattachement_code: rattachementCode,
          etape_evaluations: {
            create: [
              {
                id: etapeAutoEvaluationId,
                type: "AUTO_EVALUATION",
                evaluations_objectifs: {
                  create: {
                    id: "b6c7d8e9-0f1a-2b3c-4d5e-6f7a8b9c0d95",
                    objectif_id: objectifId,
                    auteur_id: utilisateurId,
                    note: 85,
                    commentaire: "Auto-évalué modifié",
                  },
                },
                evaluations_criteres: {
                  create: {
                    id: "c7d8e9f0-1a2b-3c4d-5e6f-7a8b9c0d1e96",
                    critere_id: critereId,
                    auteur_id: utilisateurId,
                    note: 75,
                    commentaire: "Auto-évalué critère modifié",
                  },
                },
              },
              {
                id: existingConsolidationId,
                type: "CONSOLIDATION",
                evaluations_objectifs: {
                  create: {
                    id: consolidationEvalObjectifId,
                    objectif_id: objectifId,
                    auteur_id: utilisateurId,
                    note: 50,
                    commentaire: "Consolidé",
                    date_traitement: dateTraitement,
                  },
                },
                evaluations_criteres: {
                  create: {
                    id: consolidationEvalCritereId,
                    critere_id: critereId,
                    auteur_id: utilisateurId,
                    note: 40,
                    commentaire: "Consolidé critère",
                    date_traitement: dateTraitement,
                  },
                },
              },
            ],
          },
        },
      });

      // When
      await handler.execute(
        { ficheEvaluationIds: [ficheEvaluationId] },
        utilisateurId,
      );

      // Then
      const evalObjectif = await prisma.evaluation_objectif.findUniqueOrThrow({
        where: { id: consolidationEvalObjectifId },
      });
      expect(evalObjectif.note).toBe(50);
      expect(evalObjectif.date_traitement).toBeNull();

      const evalCritere = await prisma.evaluation_critere.findUniqueOrThrow({
        where: { id: consolidationEvalCritereId },
      });
      expect(evalCritere.note).toBe(40);
      expect(evalCritere.date_traitement).toBeNull();
    });

    it("ne doit pas réinitialiser date_traitement si les notes sont identiques", async () => {
      // Given
      const rattachementCode = "REG-508";
      const ficheEvaluationId = "d8e9f0a1-2b3c-4d5e-6f7a-8b9c0d1e2f97";
      const etapeAutoEvaluationId = "e9f0a1b2-3c4d-5e6f-7a8b-9c0d1e2f3a98";
      const existingConsolidationId = "f0a1b2c3-4d5e-6f7a-8b9c-0d1e2f3a4b99";
      const utilisateurId = "a1b2c3d4-5e6f-7a8b-9c0d-1e2f3a4b5ca0";
      const objectifId = "b2c3d4e5-6f7a-8b9c-0d1e-2f3a4b5c6da1";
      const consolidationEvalObjectifId = "c3d4e5f6-7a8b-9c0d-1e2f-3a4b5c6d7ea2";
      const dateTraitement = new Date("2025-01-15");

      await prisma.utilisateur.create({
        data: {
          id: utilisateurId,
          email: "test.consolidation.same@example.com",
          nom: "Consolidation",
          prenom: "Same",
          date_creation: new Date(),
          profilCode: "DITP_ADMIN",
        },
      });

      await prisma.referentiel_rattachement.create({
        data: {
          code: rattachementCode,
          groupe: rattachementCode,
          ordre: 1,
          libelle: "Rattachement same note",
          objectifs: {
            create: {
              id: objectifId,
              libelle: "Objectif same",
              descriptif: "Description",
              jalon: 2025,
            },
          },
        },
      });

      await prisma.fiche_evaluation.create({
        data: {
          id: ficheEvaluationId,
          jalon: 2025,
          etape_courante: "AUTO_EVALUATION",
          rattachement_code: rattachementCode,
          etape_evaluations: {
            create: [
              {
                id: etapeAutoEvaluationId,
                type: "AUTO_EVALUATION",
                evaluations_objectifs: {
                  create: {
                    id: "d4e5f6a7-8b9c-0d1e-2f3a-4b5c6d7e8fa3",
                    objectif_id: objectifId,
                    auteur_id: utilisateurId,
                    note: 50,
                    commentaire: "Auto-évalué",
                  },
                },
              },
              {
                id: existingConsolidationId,
                type: "CONSOLIDATION",
                evaluations_objectifs: {
                  create: {
                    id: consolidationEvalObjectifId,
                    objectif_id: objectifId,
                    auteur_id: utilisateurId,
                    note: 50,
                    commentaire: "Consolidé",
                    date_traitement: dateTraitement,
                  },
                },
              },
            ],
          },
        },
      });

      // When
      await handler.execute(
        { ficheEvaluationIds: [ficheEvaluationId] },
        utilisateurId,
      );

      // Then
      const evalObjectif = await prisma.evaluation_objectif.findUniqueOrThrow({
        where: { id: consolidationEvalObjectifId },
      });
      expect(evalObjectif.note).toBe(50);
      expect(evalObjectif.date_traitement).toEqual(dateTraitement);
    });

    it("ne doit pas réinitialiser date_traitement si date_traitement est null", async () => {
      // Given
      const rattachementCode = "REG-509";
      const ficheEvaluationId = "e5f6a7b8-9c0d-1e2f-3a4b-5c6d7e8f9aa4";
      const etapeAutoEvaluationId = "f6a7b8c9-0d1e-2f3a-4b5c-6d7e8f9a0ba5";
      const existingConsolidationId = "a7b8c9d0-1e2f-3a4b-5c6d-7e8f9a0b1ca6";
      const utilisateurId = "b8c9d0e1-2f3a-4b5c-6d7e-8f9a0b1c2da7";
      const objectifId = "c9d0e1f2-3a4b-5c6d-7e8f-9a0b1c2d3ea8";
      const consolidationEvalObjectifId = "d0e1f2a3-4b5c-6d7e-8f9a-0b1c2d3e4fa9";

      await prisma.utilisateur.create({
        data: {
          id: utilisateurId,
          email: "test.consolidation.nodate@example.com",
          nom: "Consolidation",
          prenom: "NoDate",
          date_creation: new Date(),
          profilCode: "DITP_ADMIN",
        },
      });

      await prisma.referentiel_rattachement.create({
        data: {
          code: rattachementCode,
          groupe: rattachementCode,
          ordre: 1,
          libelle: "Rattachement no date",
          objectifs: {
            create: {
              id: objectifId,
              libelle: "Objectif no date",
              descriptif: "Description",
              jalon: 2025,
            },
          },
        },
      });

      await prisma.fiche_evaluation.create({
        data: {
          id: ficheEvaluationId,
          jalon: 2025,
          etape_courante: "AUTO_EVALUATION",
          rattachement_code: rattachementCode,
          etape_evaluations: {
            create: [
              {
                id: etapeAutoEvaluationId,
                type: "AUTO_EVALUATION",
                evaluations_objectifs: {
                  create: {
                    id: "e1f2a3b4-5c6d-7e8f-9a0b-1c2d3e4f5ab0",
                    objectif_id: objectifId,
                    auteur_id: utilisateurId,
                    note: 80,
                    commentaire: "Auto-évalué",
                  },
                },
              },
              {
                id: existingConsolidationId,
                type: "CONSOLIDATION",
                evaluations_objectifs: {
                  create: {
                    id: consolidationEvalObjectifId,
                    objectif_id: objectifId,
                    auteur_id: utilisateurId,
                    note: 60,
                    commentaire: "Consolidé",
                    date_traitement: null,
                  },
                },
              },
            ],
          },
        },
      });

      // When
      await handler.execute(
        { ficheEvaluationIds: [ficheEvaluationId] },
        utilisateurId,
      );

      // Then
      const evalObjectif = await prisma.evaluation_objectif.findUniqueOrThrow({
        where: { id: consolidationEvalObjectifId },
      });
      expect(evalObjectif.note).toBe(60);
      expect(evalObjectif.date_traitement).toBeNull();
    });
  });
});
