import { $Enums } from "@prisma/client";
import { PrismaPilote } from "@/server/db/PrismaPilote";
import { prisma } from "@/server/db/prisma";
import { PrismaTransaction } from "@/server/db/PrismaTransaction";
import { ModifierObjectifHandler } from "@/server/evaluation/handlers/ModifierObjectifHandler";
import { ProfilEnum } from "@/server/app/enum/profil.enum";

describe("ModifierObjectifHandler", () => {
  let handler: ModifierObjectifHandler;
  const prismaPilote = new PrismaPilote();
  const transaction = new PrismaTransaction();

  beforeEach(() => {
    handler = new ModifierObjectifHandler({
      prisma: prismaPilote,
      transaction,
    });
  });

  describe("#execute", () => {
    it("doit modifier le descriptif et l'indicateur cible de l'objectif", async () => {
      const rattachementCode = "REG-MODIFIER-OBJ-01";
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
          libelle: "Rattachement modifier objectif 1",
          groupe: rattachementCode,
          ordre: 1,
        },
      });

      await prisma.referentiel_objectif.create({
        data: {
          id: objectifId,
          libelle: "Objectif 1",
          descriptif: "Description initiale",
          indicateur_cible: "Indicateur initial",
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

      await handler.execute({
        ficheEvaluationId,
        objectifId,
        descriptif: "Description modifiée",
        indicateurCible: "Indicateur modifié",
      });

      const objectifUpdated = await prisma.referentiel_objectif.findUnique({
        where: { id: objectifId },
      });

      expect(objectifUpdated?.descriptif).toEqual("Description modifiée");
      expect(objectifUpdated?.indicateur_cible).toEqual("Indicateur modifié");
    });

    it("doit échouer si l'objectif n'est pas lié à la fiche d'évaluation", async () => {
      const rattachementCode = "REG-MODIFIER-OBJ-02";
      const ficheEvaluationId = "a1b2c3d4-e5f6-7890-abcd-222222222222";
      const objectifId = "e1f2a3b4-c5d6-7890-ef12-222222222222";

      await prisma.referentiel_rattachement.create({
        data: {
          code: rattachementCode,
          libelle: "Rattachement modifier objectif 2",
          groupe: rattachementCode,
          ordre: 1,
        },
      });

      await prisma.referentiel_objectif.create({
        data: {
          id: objectifId,
          libelle: "Objectif 2",
          descriptif: "Description initiale",
          indicateur_cible: "Indicateur initial",
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

      await expect(
        handler.execute({
          ficheEvaluationId,
          objectifId,
          descriptif: "Description modifiée",
          indicateurCible: "Indicateur modifié",
        }),
      ).rejects.toThrow("Objectif non trouvé pour cette fiche d'évaluation");
    });

    it("doit échouer si l'objectif n'existe pas", async () => {
      const ficheEvaluationId = "a1b2c3d4-e5f6-7890-abcd-333333333333";
      const objectifId = "e1f2a3b4-c5d6-7890-ef12-333333333333";

      await expect(
        handler.execute({
          ficheEvaluationId,
          objectifId,
          descriptif: "Description modifiée",
          indicateurCible: "Indicateur modifié",
        }),
      ).rejects.toThrow("Objectif non trouvé pour cette fiche d'évaluation");
    });

    it("ne doit pas permettre de modifier un objectif d'une autre fiche d'évaluation", async () => {
      const rattachementCode1 = "REG-MODIFIER-OBJ-04A";
      const rattachementCode2 = "REG-MODIFIER-OBJ-04B";
      const ficheEvaluationId1 = "a1b2c3d4-e5f6-7890-abcd-444444444441";
      const ficheEvaluationId2 = "a1b2c3d4-e5f6-7890-abcd-444444444442";
      const etapeEvaluationId = "b1c2d3e4-f5a6-8901-bcde-444444444444";
      const evaluationObjectifId = "c1d2e3f4-a5b6-7890-cdef-444444444444";
      const utilisateurId = "d1e2f3a4-b5c6-8901-def1-444444444444";
      const objectifId1 = "e1f2a3b4-c5d6-7890-ef12-444444444441";
      const objectifId2 = "e1f2a3b4-c5d6-7890-ef12-444444444442";

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
          code: rattachementCode1,
          libelle: "Rattachement modifier objectif 4A",
          groupe: rattachementCode1,
          ordre: 1,
        },
      });

      await prisma.referentiel_rattachement.create({
        data: {
          code: rattachementCode2,
          libelle: "Rattachement modifier objectif 4B",
          groupe: rattachementCode2,
          ordre: 2,
        },
      });

      await prisma.referentiel_objectif.create({
        data: {
          id: objectifId1,
          libelle: "Objectif 4A",
          descriptif: "Description initiale A",
          indicateur_cible: "Indicateur initial A",
          jalon: 2025,
          rattachement_code: rattachementCode1,
        },
      });

      await prisma.referentiel_objectif.create({
        data: {
          id: objectifId2,
          libelle: "Objectif 4B",
          descriptif: "Description initiale B",
          indicateur_cible: "Indicateur initial B",
          jalon: 2025,
          rattachement_code: rattachementCode2,
        },
      });

      await prisma.fiche_evaluation.create({
        data: {
          id: ficheEvaluationId1,
          jalon: 2025,
          etape_courante: $Enums.etape_evaluation_enum.AUTO_EVALUATION,
          rattachement_code: rattachementCode1,
        },
      });

      await prisma.fiche_evaluation.create({
        data: {
          id: ficheEvaluationId2,
          jalon: 2025,
          etape_courante: $Enums.etape_evaluation_enum.AUTO_EVALUATION,
          rattachement_code: rattachementCode2,
        },
      });

      await prisma.etape_evaluation.create({
        data: {
          id: etapeEvaluationId,
          fiche_evaluation_id: ficheEvaluationId1,
          type: $Enums.etape_evaluation_enum.AUTO_EVALUATION,
          read_only: false,
        },
      });

      await prisma.evaluation_objectif.create({
        data: {
          id: evaluationObjectifId,
          etape_evaluation_id: etapeEvaluationId,
          objectif_id: objectifId1,
          auteur_id: utilisateurId,
          note: 3,
          commentaire: "Commentaire test",
          date_traitement: null,
        },
      });

      await expect(
        handler.execute({
          ficheEvaluationId: ficheEvaluationId2,
          objectifId: objectifId1,
          descriptif: "Description modifiée",
          indicateurCible: "Indicateur modifié",
        }),
      ).rejects.toThrow("Objectif non trouvé pour cette fiche d'évaluation");
    });
  });
});
