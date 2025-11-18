import { $Enums } from "@prisma/client";
import { PrismaPilote } from "@/server/db/PrismaPilote";
import { prisma } from "@/server/db/prisma";
import { PrismaTransaction } from "@/server/db/PrismaTransaction";
import { SetTraitementEvaluationHandler } from "@/server/evaluation/handlers/SetTraitementEvaluationHandler";
import { ProfilEnum } from "@/server/app/enum/profil.enum";

describe("SetTraitementEvaluationHandler", () => {
  let handler: SetTraitementEvaluationHandler;
  const prismaPilote = new PrismaPilote();
  const transaction = new PrismaTransaction();

  beforeEach(() => {
    handler = new SetTraitementEvaluationHandler({
      prisma: prismaPilote,
      transaction,
    });
  });

  describe("#execute", () => {
    describe("evaluation objectif", () => {
      it("doit définir date_traitement à la date actuelle quand le statut est TRAITEE", async () => {
        const rattachementCode = "REG-TRAITEMENT-01";
        const ficheEvaluationId = "a1b2c3d4-e5f6-7890-abcd-111111111111";
        const etapeEvaluationId = "b1c2d3e4-f5a6-8901-bcde-111111111111";
        const evaluationObjectifId = "c1d2e3f4-a5b6-7890-cdef-111111111111";
        const utilisateurId = "d1e2f3a4-b5c6-8901-def1-111111111111";
        const objectifId = "e1f2a3b4-c5d6-7890-ef12-111111111111";

        await prisma.utilisateur.create({
          data: {
            id: utilisateurId,
            nom: "Doe",
            prenom: "John",
            email: "john.doe@example.com",
            fonction: "Administrateur",
            profilCode: ProfilEnum.DITP_ADMIN,
            date_creation: new Date(),
          },
        });

        await prisma.referentiel_rattachement.create({
          data: {
            code: rattachementCode,
            libelle: "Rattachement traitement 1",
            groupe: rattachementCode,
            ordre: 1,
          },
        });

        await prisma.referentiel_objectif.create({
          data: {
            id: objectifId,
            libelle: "Objectif 1",
            descriptif: "Description objectif 1",
            jalon: 2025,
            rattachement_code: rattachementCode,
          },
        });

        await prisma.fiche_evaluation.create({
          data: {
            id: ficheEvaluationId,
            jalon: 2025,
            etape_courante: $Enums.etape_evaluation_enum.CONSOLIDATION,
            rattachement_code: rattachementCode,
          },
        });

        await prisma.etape_evaluation.create({
          data: {
            id: etapeEvaluationId,
            fiche_evaluation_id: ficheEvaluationId,
            type: $Enums.etape_evaluation_enum.CONSOLIDATION,
            read_only: false,
          },
        });

        await prisma.evaluation_objectif.create({
          data: {
            id: evaluationObjectifId,
            etape_evaluation_id: etapeEvaluationId,
            objectif_id: objectifId,
            auteur_id: utilisateurId,
            note: 3,
            commentaire: "Commentaire test",
            date_traitement: null,
          },
        });

        await handler.execute({
          evaluationId: evaluationObjectifId,
          typeEvaluation: "OBJECTIF",
          statut: "TRAITEE",
        });

        const evaluationUpdated = await prisma.evaluation_objectif.findUnique({
          where: { id: evaluationObjectifId },
        });

        expect(evaluationUpdated?.date_traitement).toBeInstanceOf(Date);
      });

      it("doit définir date_traitement à null quand le statut est NON_TRAITEE", async () => {
        const rattachementCode = "REG-TRAITEMENT-02";
        const ficheEvaluationId = "a1b2c3d4-e5f6-7890-abcd-222222222222";
        const etapeEvaluationId = "b1c2d3e4-f5a6-8901-bcde-222222222222";
        const evaluationObjectifId = "c1d2e3f4-a5b6-7890-cdef-222222222222";
        const utilisateurId = "d1e2f3a4-b5c6-8901-def1-222222222222";
        const objectifId = "e1f2a3b4-c5d6-7890-ef12-222222222222";

        await prisma.utilisateur.create({
          data: {
            id: utilisateurId,
            nom: "Doe",
            prenom: "Jane",
            email: "jane.doe@example.com",
            fonction: "Administrateur",
            profilCode: ProfilEnum.DITP_ADMIN,
            date_creation: new Date(),
          },
        });

        await prisma.referentiel_rattachement.create({
          data: {
            code: rattachementCode,
            libelle: "Rattachement traitement 2",
            groupe: rattachementCode,
            ordre: 1,
          },
        });

        await prisma.referentiel_objectif.create({
          data: {
            id: objectifId,
            libelle: "Objectif 2",
            descriptif: "Description objectif 2",
            jalon: 2025,
            rattachement_code: rattachementCode,
          },
        });

        await prisma.fiche_evaluation.create({
          data: {
            id: ficheEvaluationId,
            jalon: 2025,
            etape_courante: $Enums.etape_evaluation_enum.CONSOLIDATION,
            rattachement_code: rattachementCode,
          },
        });

        await prisma.etape_evaluation.create({
          data: {
            id: etapeEvaluationId,
            fiche_evaluation_id: ficheEvaluationId,
            type: $Enums.etape_evaluation_enum.CONSOLIDATION,
            read_only: false,
          },
        });

        await prisma.evaluation_objectif.create({
          data: {
            id: evaluationObjectifId,
            etape_evaluation_id: etapeEvaluationId,
            objectif_id: objectifId,
            auteur_id: utilisateurId,
            note: 3,
            commentaire: "Commentaire test",
            date_traitement: new Date(),
          },
        });

        await handler.execute({
          evaluationId: evaluationObjectifId,
          typeEvaluation: "OBJECTIF",
          statut: "NON_TRAITEE",
        });

        const evaluationUpdated = await prisma.evaluation_objectif.findUnique({
          where: { id: evaluationObjectifId },
        });

        expect(evaluationUpdated?.date_traitement).toBeNull();
      });
    });

    describe("evaluation critere", () => {
      it("doit définir date_traitement à la date actuelle quand le statut est TRAITEE", async () => {
        const rattachementCode = "REG-TRAITEMENT-03";
        const ficheEvaluationId = "a1b2c3d4-e5f6-7890-abcd-333333333333";
        const etapeEvaluationId = "b1c2d3e4-f5a6-8901-bcde-333333333333";
        const evaluationCritereId = "c1d2e3f4-a5b6-7890-cdef-333333333333";
        const utilisateurId = "d1e2f3a4-b5c6-8901-def1-333333333333";
        const critereId = "e1f2a3b4-c5d6-7890-ef12-333333333333";

        await prisma.utilisateur.create({
          data: {
            id: utilisateurId,
            nom: "Smith",
            prenom: "Alice",
            email: "alice.smith@example.com",
            fonction: "Administrateur",
            profilCode: ProfilEnum.DITP_ADMIN,
            date_creation: new Date(),
          },
        });

        await prisma.referentiel_critere.create({
          data: {
            id: critereId,
            libelle: "Critère 1",
            descriptif: "Description critère 1",
          },
        });

        await prisma.referentiel_rattachement.create({
          data: {
            code: rattachementCode,
            libelle: "Rattachement traitement 3",
            groupe: rattachementCode,
            ordre: 1,
          },
        });

        await prisma.fiche_evaluation.create({
          data: {
            id: ficheEvaluationId,
            jalon: 2025,
            etape_courante: $Enums.etape_evaluation_enum.CONSOLIDATION,
            rattachement_code: rattachementCode,
          },
        });

        await prisma.etape_evaluation.create({
          data: {
            id: etapeEvaluationId,
            fiche_evaluation_id: ficheEvaluationId,
            type: $Enums.etape_evaluation_enum.CONSOLIDATION,
            read_only: false,
          },
        });

        await prisma.evaluation_critere.create({
          data: {
            id: evaluationCritereId,
            etape_evaluation_id: etapeEvaluationId,
            critere_id: critereId,
            auteur_id: utilisateurId,
            note: 3,
            commentaire: "Commentaire test",
            date_traitement: null,
          },
        });

        await handler.execute({
          evaluationId: evaluationCritereId,
          typeEvaluation: "MANIERE_DE_SERVIR",
          statut: "TRAITEE",
        });

        const evaluationUpdated = await prisma.evaluation_critere.findUnique({
          where: { id: evaluationCritereId },
        });

        expect(evaluationUpdated?.date_traitement).not.toBeNull();
        expect(evaluationUpdated?.date_traitement).toBeInstanceOf(Date);
      });

      it("doit définir date_traitement à null quand le statut est NON_TRAITEE", async () => {
        const rattachementCode = "REG-TRAITEMENT-04";
        const ficheEvaluationId = "a1b2c3d4-e5f6-7890-abcd-444444444444";
        const etapeEvaluationId = "b1c2d3e4-f5a6-8901-bcde-444444444444";
        const evaluationCritereId = "c1d2e3f4-a5b6-7890-cdef-444444444444";
        const utilisateurId = "d1e2f3a4-b5c6-8901-def1-444444444444";
        const critereId = "e1f2a3b4-c5d6-7890-ef12-444444444444";

        await prisma.utilisateur.create({
          data: {
            id: utilisateurId,
            nom: "Smith",
            prenom: "Bob",
            email: "bob.smith@example.com",
            fonction: "Administrateur",
            profilCode: ProfilEnum.DITP_ADMIN,
            date_creation: new Date(),
          },
        });

        await prisma.referentiel_critere.create({
          data: {
            id: critereId,
            libelle: "Critère 2",
            descriptif: "Description critère 2",
          },
        });

        await prisma.referentiel_rattachement.create({
          data: {
            code: rattachementCode,
            libelle: "Rattachement traitement 4",
            groupe: rattachementCode,
            ordre: 1,
          },
        });

        await prisma.fiche_evaluation.create({
          data: {
            id: ficheEvaluationId,
            jalon: 2025,
            etape_courante: $Enums.etape_evaluation_enum.CONSOLIDATION,
            rattachement_code: rattachementCode,
          },
        });

        await prisma.etape_evaluation.create({
          data: {
            id: etapeEvaluationId,
            fiche_evaluation_id: ficheEvaluationId,
            type: $Enums.etape_evaluation_enum.CONSOLIDATION,
            read_only: false,
          },
        });

        await prisma.evaluation_critere.create({
          data: {
            id: evaluationCritereId,
            etape_evaluation_id: etapeEvaluationId,
            critere_id: critereId,
            auteur_id: utilisateurId,
            note: 3,
            commentaire: "Commentaire test",
            date_traitement: new Date(),
          },
        });

        await handler.execute({
          evaluationId: evaluationCritereId,
          typeEvaluation: "MANIERE_DE_SERVIR",
          statut: "NON_TRAITEE",
        });

        const evaluationUpdated = await prisma.evaluation_critere.findUnique({
          where: { id: evaluationCritereId },
        });

        expect(evaluationUpdated?.date_traitement).toBeNull();
      });
    });

    it("doit échouer si la fiche n'est pas en état CONSOLIDATION", async () => {
      const rattachementCode = "REG-TRAITEMENT-05";
      const ficheEvaluationId = "a1b2c3d4-e5f6-7890-abcd-555555555555";
      const etapeEvaluationId = "b1c2d3e4-f5a6-8901-bcde-555555555555";
      const evaluationObjectifId = "c1d2e3f4-a5b6-7890-cdef-555555555555";
      const utilisateurId = "d1e2f3a4-b5c6-8901-def1-555555555555";
      const objectifId = "e1f2a3b4-c5d6-7890-ef12-555555555555";

      await prisma.utilisateur.create({
        data: {
          id: utilisateurId,
          nom: "Doe",
          prenom: "Test",
          email: "test.doe@example.com",
          fonction: "Administrateur",
          profilCode: ProfilEnum.DITP_ADMIN,
          date_creation: new Date(),
        },
      });

      await prisma.referentiel_rattachement.create({
        data: {
          code: rattachementCode,
          libelle: "Rattachement traitement 5",
          groupe: rattachementCode,
          ordre: 1,
        },
      });

      await prisma.referentiel_objectif.create({
        data: {
          id: objectifId,
          libelle: "Objectif 5",
          descriptif: "Description objectif 5",
          jalon: 2025,
          rattachement_code: rattachementCode,
        },
      });

      await prisma.fiche_evaluation.create({
        data: {
          id: ficheEvaluationId,
          jalon: 2025,
          etape_courante: $Enums.etape_evaluation_enum.AUTO_EVALUATION,
          rattachement_code: rattachementCode,
        },
      });

      await prisma.etape_evaluation.create({
        data: {
          id: etapeEvaluationId,
          fiche_evaluation_id: ficheEvaluationId,
          type: $Enums.etape_evaluation_enum.AUTO_EVALUATION,
          read_only: false,
        },
      });

      await prisma.evaluation_objectif.create({
        data: {
          id: evaluationObjectifId,
          etape_evaluation_id: etapeEvaluationId,
          objectif_id: objectifId,
          auteur_id: utilisateurId,
          note: 3,
          commentaire: "Commentaire test",
          date_traitement: null,
        },
      });

      await expect(
        handler.execute({
          evaluationId: evaluationObjectifId,
          typeEvaluation: "OBJECTIF",
          statut: "TRAITEE",
        }),
      ).rejects.toThrow(
        "La fiche d'évaluation doit être en état CONSOLIDATION",
      );
    });

    it("doit échouer si la note de l'évaluation objectif est null", async () => {
      const rattachementCode = "REG-TRAITEMENT-06";
      const ficheEvaluationId = "a1b2c3d4-e5f6-7890-abcd-666666666666";
      const etapeEvaluationId = "b1c2d3e4-f5a6-8901-bcde-666666666666";
      const evaluationObjectifId = "c1d2e3f4-a5b6-7890-cdef-666666666666";
      const utilisateurId = "d1e2f3a4-b5c6-8901-def1-666666666666";
      const objectifId = "e1f2a3b4-c5d6-7890-ef12-666666666666";

      await prisma.utilisateur.create({
        data: {
          id: utilisateurId,
          nom: "Doe",
          prenom: "NullNote",
          email: "nullnote.doe@example.com",
          fonction: "Administrateur",
          profilCode: ProfilEnum.DITP_ADMIN,
          date_creation: new Date(),
        },
      });

      await prisma.referentiel_rattachement.create({
        data: {
          code: rattachementCode,
          libelle: "Rattachement traitement 6",
          groupe: rattachementCode,
          ordre: 1,
        },
      });

      await prisma.referentiel_objectif.create({
        data: {
          id: objectifId,
          libelle: "Objectif 6",
          descriptif: "Description objectif 6",
          jalon: 2025,
          rattachement_code: rattachementCode,
        },
      });

      await prisma.fiche_evaluation.create({
        data: {
          id: ficheEvaluationId,
          jalon: 2025,
          etape_courante: $Enums.etape_evaluation_enum.CONSOLIDATION,
          rattachement_code: rattachementCode,
        },
      });

      await prisma.etape_evaluation.create({
        data: {
          id: etapeEvaluationId,
          fiche_evaluation_id: ficheEvaluationId,
          type: $Enums.etape_evaluation_enum.CONSOLIDATION,
          read_only: false,
        },
      });

      await prisma.evaluation_objectif.create({
        data: {
          id: evaluationObjectifId,
          etape_evaluation_id: etapeEvaluationId,
          objectif_id: objectifId,
          auteur_id: utilisateurId,
          note: null,
          commentaire: "Commentaire test",
          date_traitement: null,
        },
      });

      await expect(
        handler.execute({
          evaluationId: evaluationObjectifId,
          typeEvaluation: "OBJECTIF",
          statut: "TRAITEE",
        }),
      ).rejects.toThrow("La note de l'évaluation ne peut pas être null");
    });

    it("doit échouer si la note de l'évaluation critere est null", async () => {
      const rattachementCode = "REG-TRAITEMENT-07";
      const ficheEvaluationId = "a1b2c3d4-e5f6-7890-abcd-777777777777";
      const etapeEvaluationId = "b1c2d3e4-f5a6-8901-bcde-777777777777";
      const evaluationCritereId = "c1d2e3f4-a5b6-7890-cdef-777777777777";
      const utilisateurId = "d1e2f3a4-b5c6-8901-def1-777777777777";
      const critereId = "e1f2a3b4-c5d6-7890-ef12-777777777777";

      await prisma.utilisateur.create({
        data: {
          id: utilisateurId,
          nom: "Smith",
          prenom: "NullNote",
          email: "nullnote.smith@example.com",
          fonction: "Administrateur",
          profilCode: ProfilEnum.DITP_ADMIN,
          date_creation: new Date(),
        },
      });

      await prisma.referentiel_critere.create({
        data: {
          id: critereId,
          libelle: "Critère 7",
          descriptif: "Description critère 7",
        },
      });

      await prisma.referentiel_rattachement.create({
        data: {
          code: rattachementCode,
          libelle: "Rattachement traitement 7",
          groupe: rattachementCode,
          ordre: 1,
        },
      });

      await prisma.fiche_evaluation.create({
        data: {
          id: ficheEvaluationId,
          jalon: 2025,
          etape_courante: $Enums.etape_evaluation_enum.CONSOLIDATION,
          rattachement_code: rattachementCode,
        },
      });

      await prisma.etape_evaluation.create({
        data: {
          id: etapeEvaluationId,
          fiche_evaluation_id: ficheEvaluationId,
          type: $Enums.etape_evaluation_enum.CONSOLIDATION,
          read_only: false,
        },
      });

      await prisma.evaluation_critere.create({
        data: {
          id: evaluationCritereId,
          etape_evaluation_id: etapeEvaluationId,
          critere_id: critereId,
          auteur_id: utilisateurId,
          note: null,
          commentaire: "Commentaire test",
          date_traitement: null,
        },
      });

      await expect(
        handler.execute({
          evaluationId: evaluationCritereId,
          typeEvaluation: "MANIERE_DE_SERVIR",
          statut: "TRAITEE",
        }),
      ).rejects.toThrow("La note de l'évaluation ne peut pas être null");
    });
  });
});
