import { ValiderSaisieCriteresHandler } from "@/server/evaluation/handlers/ValiderSaisieCriteresHandler";
import { PrismaPilote } from "@/server/db/PrismaPilote";
import { prisma } from "@/server/db/prisma";
import { PrismaTransaction } from "@/server/db/PrismaTransaction";
import { SoumettreAutoEvaluationService } from "@/server/evaluation/services/SoumettreAutoEvaluationService";

describe("ValiderSaisieCriteresHandler", () => {
  let handler: ValiderSaisieCriteresHandler;
  const prismaPilote = new PrismaPilote();
  const transaction = new PrismaTransaction();
  const soumettreAutoEvaluationService = new SoumettreAutoEvaluationService({
    prisma: prismaPilote,
    transaction,
  });

  beforeEach(() => {
    handler = new ValiderSaisieCriteresHandler({
      prisma: prismaPilote,
      transaction,
      soumettreAutoEvaluationService,
    });
  });

  describe("execute", () => {
    it("doit marquer les critères comme validés", async () => {
      // Given
      const rattachementCode = "REG-400";
      const ficheEvaluationId = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";
      const etapeEvaluationId = "b2c3d4e5-f6a7-8901-bcde-f12345678901";

      await prisma.referentiel_rattachement.create({
        data: {
          code: rattachementCode,
          groupe: rattachementCode,
          ordre: 1,
          libelle: "Rattachement test valider critères",
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
              id: etapeEvaluationId,
              type: "AUTO_EVALUATION",
              objectifs_valides: false,
              criteres_valides: false,
            },
          },
        },
      });

      // When
      await handler.execute(
        {
          ficheEvaluationId,
        },
        "auteur-test-id",
      );

      // Then
      const etape = await prisma.etape_evaluation.findUniqueOrThrow({
        where: { id: etapeEvaluationId },
      });
      expect(etape.criteres_valides).toBe(true);
      expect(etape.objectifs_valides).toBe(false);
    });

    it("doit mettre à jour la date de modification", async () => {
      // Given
      const rattachementCode = "REG-401";
      const ficheEvaluationId = "c3d4e5f6-a7b8-9012-cdef-123456789012";
      const etapeEvaluationId = "d4e5f6a7-b8c9-0123-def1-234567890123";
      const initialDate = new Date("2025-01-01T00:00:00Z");

      await prisma.referentiel_rattachement.create({
        data: {
          code: rattachementCode,
          groupe: rattachementCode,
          ordre: 1,
          libelle: "Rattachement test date",
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
              id: etapeEvaluationId,
              type: "AUTO_EVALUATION",
              objectifs_valides: false,
              criteres_valides: false,
              updated_at: initialDate,
            },
          },
        },
      });

      // When
      await handler.execute(
        {
          ficheEvaluationId,
        },
        "auteur-test-id",
      );

      // Then
      const etape = await prisma.etape_evaluation.findUniqueOrThrow({
        where: { id: etapeEvaluationId },
      });
      expect(etape.updated_at.getTime()).toBeGreaterThan(initialDate.getTime());
    });

    it("doit échouer si la fiche n'est pas en étape AUTO_EVALUATION", async () => {
      // Given
      const rattachementCode = "REG-402";
      const ficheEvaluationId = "e5f6a7b8-c9d0-1234-ef12-345678901234";
      const etapeEvaluationId = "f6a7b8c9-d0e1-2345-f123-456789012345";

      await prisma.referentiel_rattachement.create({
        data: {
          code: rattachementCode,
          groupe: rattachementCode,
          ordre: 1,
          libelle: "Rattachement test consolidation",
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
              id: etapeEvaluationId,
              type: "AUTO_EVALUATION",
              objectifs_valides: false,
              criteres_valides: false,
            },
          },
        },
      });

      // When/Then
      await expect(
        handler.execute(
          {
            ficheEvaluationId,
          },
          "auteur-test-id",
        ),
      ).rejects.toThrow();
    });

    it("peut valider les critères même si les objectifs sont déjà validés", async () => {
      // Given
      const rattachementCode = "REG-403";
      const ficheEvaluationId = "a7b8c9d0-e1f2-3456-1234-567890123456";
      const etapeEvaluationId = "b8c9d0e1-f2a3-4567-2345-678901234567";

      await prisma.referentiel_rattachement.create({
        data: {
          code: rattachementCode,
          groupe: rattachementCode,
          ordre: 1,
          libelle: "Rattachement test objectifs déjà validés",
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
              id: etapeEvaluationId,
              type: "AUTO_EVALUATION",
              objectifs_valides: true,
              criteres_valides: false,
            },
          },
        },
      });

      // When
      await handler.execute(
        {
          ficheEvaluationId,
        },
        "auteur-test-id",
      );

      // Then
      const etape = await prisma.etape_evaluation.findUniqueOrThrow({
        where: { id: etapeEvaluationId },
      });
      expect(etape.criteres_valides).toBe(true);
      expect(etape.objectifs_valides).toBe(true);
    });

    it("doit passer à l'étape CONSOLIDATION quand les objectifs sont déjà validés", async () => {
      // Given
      const rattachementCode = "REG-404";
      const ficheEvaluationId = "c9d0e1f2-a3b4-5678-3456-789012345678";
      const etapeEvaluationId = "d0e1f2a3-b4c5-6789-4567-890123456789";
      const auteurId = "auteur-test-id";

      await prisma.referentiel_rattachement.create({
        data: {
          code: rattachementCode,
          groupe: rattachementCode,
          ordre: 1,
          libelle: "Rattachement test consolidation auto",
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
              id: etapeEvaluationId,
              type: "AUTO_EVALUATION",
              objectifs_valides: true,
              criteres_valides: false,
            },
          },
        },
      });

      // When
      await handler.execute(
        {
          ficheEvaluationId,
        },
        auteurId,
      );

      // Then
      const ficheEvaluation = await prisma.fiche_evaluation.findUniqueOrThrow({
        where: { id: ficheEvaluationId },
      });
      expect(ficheEvaluation.etape_courante).toBe("CONSOLIDATION");

      const etapeConsolidation = await prisma.etape_evaluation.findFirst({
        where: {
          fiche_evaluation_id: ficheEvaluationId,
          type: "CONSOLIDATION",
        },
      });
      expect(etapeConsolidation).not.toBeNull();
    });
  });
});
