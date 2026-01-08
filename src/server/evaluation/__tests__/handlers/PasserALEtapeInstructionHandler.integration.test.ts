import { PasserALEtapeInstructionHandler } from "@/server/evaluation/handlers/PasserALEtapeInstructionHandler";
import { PrismaPilote } from "@/server/db/PrismaPilote";
import { prisma } from "@/server/db/prisma";
import { PrismaTransaction } from "@/server/db/PrismaTransaction";
import { SoumettreEtapeEvaluationService } from "@/server/evaluation/services/SoumettreEtapeEvaluationService";

describe("PasserALEtapeInstructionHandler", () => {
  let handler: PasserALEtapeInstructionHandler;
  const prismaPilote = new PrismaPilote();
  const transaction = new PrismaTransaction();
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
    it("doit échouer si la fiche n'est pas en étape CONSOLIDATION", async () => {
      // Given
      const rattachementCode = "REG-400";
      const ficheEvaluationId = "e8f9c2d1-4a5b-4d8c-9e2f-1a3b4c5d6e7f";
      const utilisateurId = "f9a0c3d2-5b6c-4e9d-0f3a-2b4c5d6e7f8a";

      await prisma.utilisateur.create({
        data: {
          id: utilisateurId,
          email: "test.instruction1@example.com",
          nom: "Instruction",
          prenom: "Test1",
          date_creation: new Date(),
          profilCode: "DITP_ADMIN",
        },
      });

      await prisma.referentiel_rattachement_groupe.create({
        data: {
          code: rattachementCode,
          libelle: rattachementCode,
          ordre: 1,
        },
      });

      await prisma.referentiel_rattachement.create({
        data: {
          code: rattachementCode,
          groupe: rattachementCode,
          ordre: 1,
          libelle: "Rattachement instruction test",
        },
      });

      await prisma.fiche_evaluation.create({
        data: {
          id: ficheEvaluationId,
          jalon: 2025,
          etape_courante: "AUTO_EVALUATION", // Pas en consolidation
          rattachement_code: rattachementCode,
          etape_evaluations: {
            create: {
              id: "a1b2c3d4-5e6f-7a8b-9c0d-1e2f3a4b5c6d",
              type: "CONSOLIDATION",
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

    it("doit créer une étape INSTRUCTION avec les évaluations clonées", async () => {
      // Given
      const rattachementCode = "REG-402";
      const ficheEvaluationId = "e2f3a4b5-9c0d-7e1f-2a3b-5c6d7e8f9a0b";
      const etapeConsolidationId = "f3a4b5c6-0d1e-8f2a-3b4c-6d7e8f9a0b1c";
      const utilisateurId = "a4b5c6d7-1e2f-9a3b-4c5d-7e8f9a0b1c2d";
      const nouvelAuteurId = "b5c6d7e8-2f3a-0b4c-5d6e-8f9a0b1c2d3e";
      const objectifId = "c6d7e8f9-3a4b-1c5d-6e7f-9a0b1c2d3e4f";
      const critereId = "d7e8f9a0-4b5c-2d6e-7f8a-0b1c2d3e4f5a";
      const sousCritereId = "e8f9a0b1-5c6d-3e7f-8a9b-1c2d3e4f5a6b";
      const evaluationObjectifId = "f9a0b1c2-6d7e-4f8a-9b0c-2d3e4f5a6b7c";
      const evaluationCritereId = "a0b1c2d3-7e8f-5a9b-0c1d-3e4f5a6b7c8d";

      await prisma.utilisateur.createMany({
        data: [
          {
            id: utilisateurId,
            email: "test.instruction3@example.com",
            nom: "Instruction",
            prenom: "Test3",
            date_creation: new Date(),
            profilCode: "DITP_ADMIN",
          },
          {
            id: nouvelAuteurId,
            email: "test.instruction3b@example.com",
            nom: "Instruction",
            prenom: "Test3b",
            date_creation: new Date(),
            profilCode: "DITP_ADMIN",
          },
        ],
      });

      await prisma.referentiel_critere.create({
        data: {
          id: critereId,
          libelle: "Critère instruction",
          descriptif: "Description",
          sous_criteres: {
            create: {
              id: sousCritereId,
              libelle: "Sous-critère instruction",
              descriptif: "Description",
            },
          },
        },
      });

      await prisma.referentiel_rattachement_groupe.create({
        data: {
          code: rattachementCode,
          libelle: rattachementCode,
          ordre: 1,
        },
      });

      await prisma.referentiel_rattachement.create({
        data: {
          code: rattachementCode,
          groupe: rattachementCode,
          ordre: 1,
          libelle: "Rattachement instruction clone",
          objectifs: {
            create: {
              id: objectifId,
              libelle: "Objectif instruction",
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
          etape_courante: "CONSOLIDATION",
          rattachement_code: rattachementCode,
          etape_evaluations: {
            create: {
              id: etapeConsolidationId,
              type: "CONSOLIDATION",
              evaluations_objectifs: {
                create: {
                  id: evaluationObjectifId,
                  objectif_id: objectifId,
                  auteur_id: utilisateurId,
                  note: 3,
                  commentaire: "Objectif consolidé",
                },
              },
              evaluations_criteres: {
                create: {
                  id: evaluationCritereId,
                  critere_id: critereId,
                  auteur_id: utilisateurId,
                  note: 2,
                  commentaire: "Critère consolidé",
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
      const etapeInstruction = await prisma.etape_evaluation.findFirstOrThrow({
        where: {
          fiche_evaluation_id: ficheEvaluationId,
          type: "INSTRUCTION",
        },
        include: {
          evaluations_objectifs: true,
          evaluations_criteres: true,
        },
      });

      expect(etapeInstruction.evaluations_objectifs).toEqual([
        expect.objectContaining({
          objectif_id: objectifId,
          auteur_id: nouvelAuteurId,
          note: 3,
          commentaire: "",
        }),
      ]);
      expect(etapeInstruction.evaluations_objectifs.at(0)?.id).not.toBe(
        evaluationObjectifId,
      );

      expect(etapeInstruction.evaluations_criteres).toEqual([
        expect.objectContaining({
          critere_id: critereId,
          auteur_id: nouvelAuteurId,
          note: 2,
          commentaire: "",
        }),
      ]);
      expect(etapeInstruction.evaluations_criteres.at(0)?.id).not.toBe(
        evaluationCritereId,
      );
    });

    it("doit traiter plusieurs fiches en une seule transaction", async () => {
      // Given
      const rattachementCode = "REG-403";
      const rattachementCode2 = "REG-402";
      const ficheEvaluationId1 = "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d";
      const ficheEvaluationId2 = "b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e";
      const etapeConsolidationId1 = "c3d4e5f6-a7b8-9c0d-1e2f-3a4b5c6d7e8f";
      const etapeConsolidationId2 = "d4e5f6a7-b8c9-0d1e-2f3a-4b5c6d7e8f9a";
      const utilisateurId = "e5f6a7b8-c9d0-1e2f-3a4b-5c6d7e8f9a0b";

      await prisma.utilisateur.create({
        data: {
          id: utilisateurId,
          email: "test.instruction4@example.com",
          nom: "Instruction",
          prenom: "Test4",
          date_creation: new Date(),
          profilCode: "DITP_ADMIN",
        },
      });

      await prisma.referentiel_rattachement_groupe.create({
        data: {
          code: rattachementCode,
          libelle: rattachementCode,
          ordre: 1,
        },
      });

      await prisma.referentiel_rattachement.create({
        data: {
          code: rattachementCode,
          groupe: rattachementCode,
          ordre: 1,
          libelle: "Rattachement instruction multiple",
        },
      });

      await prisma.referentiel_rattachement.create({
        data: {
          code: rattachementCode2,
          groupe: rattachementCode,
          ordre: 1,
          libelle: "Rattachement instruction multiple 2",
        },
      });

      await prisma.fiche_evaluation.createMany({
        data: [
          {
            id: ficheEvaluationId1,
            jalon: 2025,
            etape_courante: "CONSOLIDATION",
            rattachement_code: rattachementCode,
          },
          {
            id: ficheEvaluationId2,
            jalon: 2025,
            etape_courante: "CONSOLIDATION",
            rattachement_code: rattachementCode2,
          },
        ],
      });

      await prisma.etape_evaluation.createMany({
        data: [
          {
            id: etapeConsolidationId1,
            type: "CONSOLIDATION",
            fiche_evaluation_id: ficheEvaluationId1,
          },
          {
            id: etapeConsolidationId2,
            type: "CONSOLIDATION",
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
          (fiche) => fiche.etape_courante === "INSTRUCTION",
        ),
      ).toBe(true);

      const etapesInstruction = await prisma.etape_evaluation.findMany({
        where: {
          fiche_evaluation_id: { in: [ficheEvaluationId1, ficheEvaluationId2] },
          type: "INSTRUCTION",
        },
      });

      expect(etapesInstruction).toHaveLength(2);
    });

    it("doit mettre à jour l'étape INSTRUCTION existante si elle n'a pas de notes", async () => {
      // Given
      const rattachementCode = "REG-404";
      const ficheEvaluationId = "f1a2b3c4-d5e6-7f8a-9b0c-1d2e3f4a5b6c";
      const etapeConsolidationId = "a2b3c4d5-e6f7-8a9b-0c1d-2e3f4a5b6c7d";
      const etapeInstructionId = "b3c4d5e6-f7a8-9b0c-1d2e-3f4a5b6c7d8e";
      const utilisateurId = "c4d5e6f7-a8b9-0c1d-2e3f-4a5b6c7d8e9f";
      const objectifId = "d5e6f7a8-b9c0-1d2e-3f4a-5b6c7d8e9f0a";
      const critereId = "e6f7a8b9-c0d1-2e3f-4a5b-6c7d8e9f0a1b";
      const evaluationObjectifConsolidationId =
        "f7a8b9c0-d1e2-3f4a-5b6c-7d8e9f0a1b2c";
      const evaluationCritereConsolidationId =
        "a8b9c0d1-e2f3-4a5b-6c7d-8e9f0a1b2c3d";
      const evaluationObjectifInstructionId =
        "b9c0d1e2-f3a4-5b6c-7d8e-9f0a1b2c3d4e";
      const evaluationCritereInstructionId =
        "c0d1e2f3-a4b5-6c7d-8e9f-0a1b2c3d4e5f";

      await prisma.utilisateur.create({
        data: {
          id: utilisateurId,
          email: "test.instruction5@example.com",
          nom: "Instruction",
          prenom: "Test5",
          date_creation: new Date(),
          profilCode: "DITP_ADMIN",
        },
      });

      await prisma.referentiel_critere.create({
        data: {
          id: critereId,
          libelle: "Critère existing instruction",
          descriptif: "Description",
        },
      });

      await prisma.referentiel_rattachement_groupe.create({
        data: {
          code: rattachementCode,
          libelle: rattachementCode,
          ordre: 1,
        },
      });

      await prisma.referentiel_rattachement.create({
        data: {
          code: rattachementCode,
          groupe: rattachementCode,
          ordre: 1,
          libelle: "Rattachement instruction existante",
          objectifs: {
            create: {
              id: objectifId,
              libelle: "Objectif instruction existante",
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
          etape_courante: "CONSOLIDATION",
          rattachement_code: rattachementCode,
          etape_evaluations: {
            create: [
              {
                id: etapeConsolidationId,
                type: "CONSOLIDATION",
                evaluations_objectifs: {
                  create: {
                    id: evaluationObjectifConsolidationId,
                    objectif_id: objectifId,
                    auteur_id: utilisateurId,
                    note: 4,
                    commentaire: "Objectif consolidé",
                  },
                },
                evaluations_criteres: {
                  create: {
                    id: evaluationCritereConsolidationId,
                    critere_id: critereId,
                    auteur_id: utilisateurId,
                    note: 3,
                    commentaire: "Critère consolidé",
                  },
                },
              },
              {
                id: etapeInstructionId,
                type: "INSTRUCTION",
                evaluations_objectifs: {
                  create: {
                    id: evaluationObjectifInstructionId,
                    objectif_id: objectifId,
                    auteur_id: utilisateurId,
                    note: null,
                    commentaire: "",
                  },
                },
                evaluations_criteres: {
                  create: {
                    id: evaluationCritereInstructionId,
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
      const evaluationObjectif =
        await prisma.evaluation_objectif.findUniqueOrThrow({
          where: { id: evaluationObjectifInstructionId },
        });
      expect(evaluationObjectif.note).toBe(4);

      const evaluationCritere =
        await prisma.evaluation_critere.findUniqueOrThrow({
          where: { id: evaluationCritereInstructionId },
        });
      expect(evaluationCritere.note).toBe(3);
    });

    it("doit ignorer les évaluations qui ont déjà des notes en instruction", async () => {
      // Given
      const rattachementCode = "REG-405";
      const ficheEvaluationId = "d1e2f3a4-b5c6-d7e8-f9a0-b1c2d3e4f5a6";
      const etapeConsolidationId = "e2f3a4b5-c6d7-e8f9-a0b1-c2d3e4f5a6b7";
      const etapeInstructionId = "f3a4b5c6-d7e8-f9a0-b1c2-d3e4f5a6b7c8";
      const utilisateurId = "a4b5c6d7-e8f9-a0b1-c2d3-e4f5a6b7c8d9";
      const objectifId = "b5c6d7e8-f9a0-b1c2-d3e4-f5a6b7c8d9e0";
      const evaluationObjectifConsolidationId =
        "c6d7e8f9-a0b1-c2d3-e4f5-a6b7c8d9e0f1";
      const evaluationObjectifInstructionId =
        "d7e8f9a0-b1c2-d3e4-f5a6-b7c8d9e0f1a2";

      await prisma.utilisateur.create({
        data: {
          id: utilisateurId,
          email: "test.instruction6@example.com",
          nom: "Instruction",
          prenom: "Test6",
          date_creation: new Date(),
          profilCode: "DITP_ADMIN",
        },
      });

      await prisma.referentiel_rattachement_groupe.create({
        data: {
          code: rattachementCode,
          libelle: rattachementCode,
          ordre: 1,
        },
      });

      await prisma.referentiel_rattachement.create({
        data: {
          code: rattachementCode,
          groupe: rattachementCode,
          ordre: 1,
          libelle: "Rattachement instruction avec notes",
          objectifs: {
            create: {
              id: objectifId,
              libelle: "Objectif avec notes",
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
          etape_courante: "CONSOLIDATION",
          rattachement_code: rattachementCode,
          etape_evaluations: {
            create: [
              {
                id: etapeConsolidationId,
                type: "CONSOLIDATION",
                evaluations_objectifs: {
                  create: {
                    id: evaluationObjectifConsolidationId,
                    objectif_id: objectifId,
                    auteur_id: utilisateurId,
                    note: 4,
                    commentaire: "Note consolidation",
                  },
                },
              },
              {
                id: etapeInstructionId,
                type: "INSTRUCTION",
                evaluations_objectifs: {
                  create: {
                    id: evaluationObjectifInstructionId,
                    objectif_id: objectifId,
                    auteur_id: utilisateurId,
                    note: 2,
                    commentaire: "Note déjà présente",
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
      const evaluationObjectif =
        await prisma.evaluation_objectif.findUniqueOrThrow({
          where: { id: evaluationObjectifInstructionId },
        });
      expect(evaluationObjectif.note).toBe(2);
      expect(evaluationObjectif.commentaire).toBe("Note déjà présente");
    });

    it("doit réinitialiser date_traitement si la note a changé entre consolidation et instruction", async () => {
      // Given
      const rattachementCode = "REG-406";
      const ficheEvaluationId = "e2f3a4b5-c6d7-e8f9-a0b1-c2d3e4f5a6b7";
      const etapeConsolidationId = "f3a4b5c6-d7e8-f9a0-b1c2-d3e4f5a6b7c8";
      const etapeInstructionId = "a4b5c6d7-e8f9-a0b1-c2d3-e4f5a6b7c8d9";
      const utilisateurId = "b5c6d7e8-f9a0-b1c2-d3e4-f5a6b7c8d9e0";
      const objectifId = "c6d7e8f9-a0b1-c2d3-e4f5-a6b7c8d9e0f1";
      const critereId = "d7e8f9a0-b1c2-d3e4-f5a6-b7c8d9e0f1a2";
      const evaluationObjectifConsolidationId =
        "e8f9a0b1-c2d3-e4f5-a6b7-c8d9e0f1a2b3";
      const evaluationCritereConsolidationId =
        "f9a0b1c2-d3e4-f5a6-b7c8-d9e0f1a2b3c4";
      const evaluationObjectifInstructionId =
        "a0b1c2d3-e4f5-a6b7-c8d9-e0f1a2b3c4d5";
      const evaluationCritereInstructionId =
        "b1c2d3e4-f5a6-b7c8-d9e0-f1a2b3c4d5e6";
      const dateTraitement = new Date("2025-01-01");

      await prisma.utilisateur.create({
        data: {
          id: utilisateurId,
          email: "test.instruction7@example.com",
          nom: "Instruction",
          prenom: "Test7",
          date_creation: new Date(),
          profilCode: "DITP_ADMIN",
        },
      });

      await prisma.referentiel_critere.create({
        data: {
          id: critereId,
          libelle: "Critère date traitement",
          descriptif: "Description",
        },
      });

      await prisma.referentiel_rattachement_groupe.create({
        data: {
          code: rattachementCode,
          libelle: rattachementCode,
          ordre: 1,
        },
      });

      await prisma.referentiel_rattachement.create({
        data: {
          code: rattachementCode,
          groupe: rattachementCode,
          ordre: 1,
          libelle: "Rattachement date traitement",
          objectifs: {
            create: {
              id: objectifId,
              libelle: "Objectif date traitement",
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
          etape_courante: "CONSOLIDATION",
          rattachement_code: rattachementCode,
          etape_evaluations: {
            create: [
              {
                id: etapeConsolidationId,
                type: "CONSOLIDATION",
                evaluations_objectifs: {
                  create: {
                    id: evaluationObjectifConsolidationId,
                    objectif_id: objectifId,
                    auteur_id: utilisateurId,
                    note: 4,
                    commentaire: "Note consolidation",
                  },
                },
                evaluations_criteres: {
                  create: {
                    id: evaluationCritereConsolidationId,
                    critere_id: critereId,
                    auteur_id: utilisateurId,
                    note: 3,
                    commentaire: "Critère consolidation",
                  },
                },
              },
              {
                id: etapeInstructionId,
                type: "INSTRUCTION",
                evaluations_objectifs: {
                  create: {
                    id: evaluationObjectifInstructionId,
                    objectif_id: objectifId,
                    auteur_id: utilisateurId,
                    note: 2,
                    commentaire: "Note instruction différente",
                    date_traitement: dateTraitement,
                  },
                },
                evaluations_criteres: {
                  create: {
                    id: evaluationCritereInstructionId,
                    critere_id: critereId,
                    auteur_id: utilisateurId,
                    note: 1,
                    commentaire: "Critère instruction différent",
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
      const evaluationObjectif =
        await prisma.evaluation_objectif.findUniqueOrThrow({
          where: { id: evaluationObjectifInstructionId },
        });
      expect(evaluationObjectif.note).toBe(2);
      expect(evaluationObjectif.date_traitement).toBeNull();

      const evaluationCritere =
        await prisma.evaluation_critere.findUniqueOrThrow({
          where: { id: evaluationCritereInstructionId },
        });
      expect(evaluationCritere.note).toBe(1);
      expect(evaluationCritere.date_traitement).toBeNull();
    });

    it("doit créer l'évaluation d'objectif manquante si elle n'existe pas en instruction", async () => {
      // Given
      const rattachementCode = "REG-407";
      const ficheEvaluationId = "f3a4b5c6-d7e8-f9a0-b1c2-d3e4f5a6b7c8";
      const etapeConsolidationId = "a4b5c6d7-e8f9-a0b1-c2d3-e4f5a6b7c8d9";
      const etapeInstructionId = "b5c6d7e8-f9a0-b1c2-d3e4-f5a6b7c8d9e0";
      const utilisateurId = "c6d7e8f9-a0b1-c2d3-e4f5-a6b7c8d9e0f1";
      const objectifId1 = "d7e8f9a0-b1c2-d3e4-f5a6-b7c8d9e0f1a2";
      const objectifId2 = "e8f9a0b1-c2d3-e4f5-a6b7-c8d9e0f1a2b3";
      const evaluationObjectifConsolidationId1 =
        "f9a0b1c2-d3e4-f5a6-b7c8-d9e0f1a2b3c4";
      const evaluationObjectifConsolidationId2 =
        "a0b1c2d3-e4f5-a6b7-c8d9-e0f1a2b3c4d5";
      const evaluationObjectifInstructionId1 =
        "b1c2d3e4-f5a6-b7c8-d9e0-f1a2b3c4d5e6";

      await prisma.utilisateur.create({
        data: {
          id: utilisateurId,
          email: "test.instruction8@example.com",
          nom: "Instruction",
          prenom: "Test8",
          date_creation: new Date(),
          profilCode: "DITP_ADMIN",
        },
      });

      await prisma.referentiel_rattachement.create({
        data: {
          code: rattachementCode,
          groupe: rattachementCode,
          ordre: 1,
          libelle: "Rattachement objectif manquant",
          objectifs: {
            create: [
              {
                id: objectifId1,
                libelle: "Objectif 1",
                descriptif: "Description",
                jalon: 2025,
              },
              {
                id: objectifId2,
                libelle: "Objectif 2",
                descriptif: "Description",
                jalon: 2025,
              },
            ],
          },
        },
      });

      await prisma.fiche_evaluation.create({
        data: {
          id: ficheEvaluationId,
          jalon: 2025,
          etape_courante: "CONSOLIDATION",
          rattachement_code: rattachementCode,
          etape_evaluations: {
            create: [
              {
                id: etapeConsolidationId,
                type: "CONSOLIDATION",
                evaluations_objectifs: {
                  create: [
                    {
                      id: evaluationObjectifConsolidationId1,
                      objectif_id: objectifId1,
                      auteur_id: utilisateurId,
                      note: 3,
                      commentaire: "Objectif 1 consolidé",
                    },
                    {
                      id: evaluationObjectifConsolidationId2,
                      objectif_id: objectifId2,
                      auteur_id: utilisateurId,
                      note: 4,
                      commentaire: "Objectif 2 consolidé",
                    },
                  ],
                },
              },
              {
                id: etapeInstructionId,
                type: "INSTRUCTION",
                evaluations_objectifs: {
                  create: {
                    id: evaluationObjectifInstructionId1,
                    objectif_id: objectifId1,
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
      const evaluationsObjectifs = await prisma.evaluation_objectif.findMany({
        where: {
          etape_evaluation_id: etapeInstructionId,
        },
        orderBy: { objectif_id: "asc" },
      });

      expect(evaluationsObjectifs).toEqual([
        expect.objectContaining({
          objectif_id: objectifId1,
          auteur_id: utilisateurId,
          note: 3,
        }),
        expect.objectContaining({
          objectif_id: objectifId2,
          auteur_id: utilisateurId,
          note: 4,
          commentaire: "",
        }),
      ]);
    });

    it("doit créer l'évaluation de critère manquante si elle n'existe pas en instruction", async () => {
      // Given
      const rattachementCode = "REG-408";
      const ficheEvaluationId = "c6d7e8f9-a0b1-c2d3-e4f5-a6b7c8d9e0f1";
      const etapeConsolidationId = "d7e8f9a0-b1c2-d3e4-f5a6-b7c8d9e0f1a2";
      const etapeInstructionId = "e8f9a0b1-c2d3-e4f5-a6b7-c8d9e0f1a2b3";
      const utilisateurId = "f9a0b1c2-d3e4-f5a6-b7c8-d9e0f1a2b3c4";
      const critereId1 = "a0b1c2d3-e4f5-a6b7-c8d9-e0f1a2b3c4d5";
      const critereId2 = "b1c2d3e4-f5a6-b7c8-d9e0-f1a2b3c4d5e6";
      const evaluationCritereConsolidationId1 =
        "c2d3e4f5-a6b7-c8d9-e0f1-a2b3c4d5e6f7";
      const evaluationCritereConsolidationId2 =
        "d3e4f5a6-b7c8-d9e0-f1a2-b3c4d5e6f7a8";
      const evaluationCritereInstructionId1 =
        "e4f5a6b7-c8d9-e0f1-a2b3-c4d5e6f7a8b9";

      await prisma.utilisateur.create({
        data: {
          id: utilisateurId,
          email: "test.instruction9@example.com",
          nom: "Instruction",
          prenom: "Test9",
          date_creation: new Date(),
          profilCode: "DITP_ADMIN",
        },
      });

      await prisma.referentiel_critere.createMany({
        data: [
          {
            id: critereId1,
            libelle: "Critère 1",
            descriptif: "Description",
          },
          {
            id: critereId2,
            libelle: "Critère 2",
            descriptif: "Description",
          },
        ],
      });

      await prisma.referentiel_rattachement.create({
        data: {
          code: rattachementCode,
          groupe: rattachementCode,
          ordre: 1,
          libelle: "Rattachement critère manquant",
        },
      });

      await prisma.fiche_evaluation.create({
        data: {
          id: ficheEvaluationId,
          jalon: 2025,
          etape_courante: "CONSOLIDATION",
          rattachement_code: rattachementCode,
          etape_evaluations: {
            create: [
              {
                id: etapeConsolidationId,
                type: "CONSOLIDATION",
                evaluations_criteres: {
                  create: [
                    {
                      id: evaluationCritereConsolidationId1,
                      critere_id: critereId1,
                      auteur_id: utilisateurId,
                      note: 2,
                      commentaire: "Critère 1 consolidé",
                    },
                    {
                      id: evaluationCritereConsolidationId2,
                      critere_id: critereId2,
                      auteur_id: utilisateurId,
                      note: 5,
                      commentaire: "Critère 2 consolidé",
                    },
                  ],
                },
              },
              {
                id: etapeInstructionId,
                type: "INSTRUCTION",
                evaluations_criteres: {
                  create: {
                    id: evaluationCritereInstructionId1,
                    critere_id: critereId1,
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
      const evaluationsCriteres = await prisma.evaluation_critere.findMany({
        where: {
          etape_evaluation_id: etapeInstructionId,
        },
        orderBy: { critere_id: "asc" },
      });

      expect(evaluationsCriteres).toEqual([
        expect.objectContaining({
          critere_id: critereId1,
          auteur_id: utilisateurId,
          note: 2,
        }),
        expect.objectContaining({
          critere_id: critereId2,
          auteur_id: utilisateurId,
          note: 5,
          commentaire: "",
        }),
      ]);
    });
  });
});
