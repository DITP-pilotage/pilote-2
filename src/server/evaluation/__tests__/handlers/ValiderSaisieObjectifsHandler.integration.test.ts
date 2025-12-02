import { ValiderSaisieObjectifsHandler } from "@/server/evaluation/handlers/ValiderSaisieObjectifsHandler";
import { PrismaPilote } from "@/server/db/PrismaPilote";
import { prisma } from "@/server/db/prisma";
import { PrismaTransaction } from "@/server/db/PrismaTransaction";
import { SoumettreEtapeEvaluationService } from "@/server/evaluation/services/SoumettreEtapeEvaluationService";

describe("ValiderSaisieObjectifsHandler", () => {
  let handler: ValiderSaisieObjectifsHandler;
  const prismaPilote = new PrismaPilote();
  const transaction = new PrismaTransaction();
  const soumettreEtapeEvaluationService = new SoumettreEtapeEvaluationService({
    prisma: prismaPilote,
    transaction,
  });

  beforeEach(() => {
    handler = new ValiderSaisieObjectifsHandler({
      prisma: prismaPilote,
      transaction,
      soumettreEtapeEvaluationService,
    });
  });

  describe("execute", () => {
    it("doit marquer les objectifs comme validés", async () => {
      // Given
      const rattachementCode = "REG-500";
      const ficheEvaluationId = "a1b2c3d4-e5f6-7890-abcd-ef1234567891";
      const etapeEvaluationId = "b2c3d4e5-f6a7-8901-bcde-f12345678902";

      await prisma.referentiel_rattachement.create({
        data: {
          code: rattachementCode,
          groupe: rattachementCode,
          ordre: 1,
          libelle: "Rattachement test valider objectifs",
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
      expect(etape.objectifs_valides).toBe(true);
      expect(etape.criteres_valides).toBe(false);
    });

    it("doit mettre à jour la date de modification", async () => {
      // Given
      const rattachementCode = "REG-501";
      const ficheEvaluationId = "c3d4e5f6-a7b8-9012-cdef-123456789013";
      const etapeEvaluationId = "d4e5f6a7-b8c9-0123-def1-234567890124";
      const initialDate = new Date("2025-01-01T00:00:00Z");

      await prisma.referentiel_rattachement.create({
        data: {
          code: rattachementCode,
          groupe: rattachementCode,
          ordre: 1,
          libelle: "Rattachement test date objectifs",
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
      const rattachementCode = "REG-502";
      const ficheEvaluationId = "e5f6a7b8-c9d0-1234-ef12-345678901235";
      const etapeEvaluationId = "f6a7b8c9-d0e1-2345-f123-456789012346";

      await prisma.referentiel_rattachement.create({
        data: {
          code: rattachementCode,
          groupe: rattachementCode,
          ordre: 1,
          libelle: "Rattachement test consolidation objectifs",
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

    it("peut valider les objectifs même si les critères sont déjà validés", async () => {
      // Given
      const rattachementCode = "REG-503";
      const ficheEvaluationId = "a7b8c9d0-e1f2-3456-1234-567890123457";
      const etapeEvaluationId = "b8c9d0e1-f2a3-4567-2345-678901234568";

      await prisma.referentiel_rattachement.create({
        data: {
          code: rattachementCode,
          groupe: rattachementCode,
          ordre: 1,
          libelle: "Rattachement test critères déjà validés",
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
              criteres_valides: true,
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
      expect(etape.objectifs_valides).toBe(true);
      expect(etape.criteres_valides).toBe(true);
    });

    it("doit passer à l'étape CONSOLIDATION quand les critères sont déjà validés", async () => {
      // Given
      const rattachementCode = "REG-504";
      const ficheEvaluationId = "c9d0e1f2-a3b4-5678-3456-789012345679";
      const etapeEvaluationId = "d0e1f2a3-b4c5-6789-4567-890123456790";
      const auteurId = "auteur-test-id";

      await prisma.referentiel_rattachement.create({
        data: {
          code: rattachementCode,
          groupe: rattachementCode,
          ordre: 1,
          libelle: "Rattachement test consolidation auto objectifs",
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
              criteres_valides: true,
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
