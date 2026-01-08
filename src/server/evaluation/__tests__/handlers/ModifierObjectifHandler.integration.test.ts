import { $Enums } from "@prisma/client";
import { PrismaPilote } from "@/server/db/PrismaPilote";
import { prisma } from "@/server/db/prisma";
import { PrismaTransaction } from "@/server/db/PrismaTransaction";
import { ModifierObjectifHandler } from "@/server/evaluation/handlers/ModifierObjectifHandler";

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
      const objectifId = "e1f2a3b4-c5d6-7890-ef12-111111111111";

      await prisma.referentiel_rattachement_groupe.create({
        data: {
          code: rattachementCode,
          libelle: "Groupe modifier objectif 1",
          ordre: 1,
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
      const rattachementCode1 = "REG-MODIFIER-OBJ-02A";
      const rattachementCode2 = "REG-MODIFIER-OBJ-02B";
      const ficheEvaluationId = "a1b2c3d4-e5f6-7890-abcd-222222222222";
      const objectifId = "e1f2a3b4-c5d6-7890-ef12-222222222222";

      await prisma.referentiel_rattachement_groupe.createMany({
        data: [
          {
            code: rattachementCode1,
            libelle: "Groupe modifier objectif 2A",
            ordre: 1,
          },
          {
            code: rattachementCode2,
            libelle: "Groupe modifier objectif 2B",
            ordre: 2,
          },
        ],
      });

      await prisma.referentiel_rattachement.create({
        data: {
          code: rattachementCode1,
          libelle: "Rattachement modifier objectif 2A",
          groupe: rattachementCode1,
          ordre: 1,
        },
      });

      await prisma.referentiel_rattachement.create({
        data: {
          code: rattachementCode2,
          libelle: "Rattachement modifier objectif 2B",
          groupe: rattachementCode2,
          ordre: 2,
        },
      });

      await prisma.referentiel_objectif.create({
        data: {
          id: objectifId,
          libelle: "Objectif 2",
          descriptif: "Description initiale",
          indicateur_cible: "Indicateur initial",
          jalon: 2025,
          rattachement_code: rattachementCode1,
        },
      });

      await prisma.fiche_evaluation.create({
        data: {
          id: ficheEvaluationId,
          jalon: 2025,
          etape_courante: $Enums.etape_evaluation_enum.AUTO_EVALUATION,
          rattachement_code: rattachementCode2,
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
  });
});
