import { $Enums } from "@prisma/client";
import { PrismaPilote } from "@/server/db/PrismaPilote";
import { prisma } from "@/server/db/prisma";
import { PrismaTransaction } from "@/server/db/PrismaTransaction";
import { ModifierEtatFichesConsolidationHandler } from "@/server/evaluation/handlers/ModifierEtatFichesConsolidationHandler";

describe("ModifierEtatFichesConsolidationHandler", () => {
  let handler: ModifierEtatFichesConsolidationHandler;
  const prismaPilote = new PrismaPilote();
  const transaction = new PrismaTransaction();

  beforeEach(() => {
    handler = new ModifierEtatFichesConsolidationHandler({
      prisma: prismaPilote,
      transaction,
    });
  });

  describe("#execute", () => {
    it("doit débloquer plusieurs fiches consolidation en une seule opération", async () => {
      // Given
      const rattachement1Code = "REG-CONSO-01";
      const rattachement2Code = "REG-CONSO-02";
      const rattachement3Code = "REG-CONSO-03";
      const rattachement4Code = "REG-CONSO-04";
      const rattachement5Code = "REG-CONSO-05";

      const fiche1Id = "07b7e6fe-198b-4d83-bf18-3f58e6675149";
      const fiche2Id = "14b013d3-9b68-47c2-90e2-78afdd5ab3c3";
      const fiche3Id = "f340e68e-edba-42f3-9a65-cbf5b06ac086";
      const fiche4Id = "dfdc1059-21da-4a4e-a0b4-ebc39162eb64";
      const fiche5Id = "37d94f52-0b23-4c1e-ac8a-452467a79144";

      const etape1Id = "9fafcee3-3c00-4178-be91-fb823e5fcfe0";
      const etape2Id = "39e1eeb6-925b-450f-ae98-006d9a06a8ff";
      const etape3Id = "c3dc9b77-77bd-4437-becd-f91b9c4a6cc2";
      const etape4Id = "52b1baa6-b140-4970-a848-f3eda3eca0c6";
      const etape5Id = "e1960814-e123-46ab-b465-0e9e98e41f79";

      await prisma.referentiel_rattachement.createMany({
        data: [
          { code: rattachement1Code, libelle: "Rattachement consolidation 1" },
          { code: rattachement2Code, libelle: "Rattachement consolidation 2" },
          { code: rattachement3Code, libelle: "Rattachement consolidation 3" },
          { code: rattachement4Code, libelle: "Rattachement consolidation 4" },
          { code: rattachement5Code, libelle: "Rattachement consolidation 5" },
        ],
      });

      await prisma.fiche_evaluation.createMany({
        data: [
          {
            id: fiche1Id,
            jalon: 2025,
            etape_courante: $Enums.etape_evaluation_enum.CONSOLIDATION,
            rattachement_code: rattachement1Code,
          },
          {
            id: fiche2Id,
            jalon: 2025,
            etape_courante: $Enums.etape_evaluation_enum.CONSOLIDATION,
            rattachement_code: rattachement2Code,
          },
          {
            id: fiche3Id,
            jalon: 2025,
            etape_courante: $Enums.etape_evaluation_enum.CONSOLIDATION,
            rattachement_code: rattachement3Code,
          },
          {
            id: fiche4Id,
            jalon: 2025,
            etape_courante: $Enums.etape_evaluation_enum.CONSOLIDATION,
            rattachement_code: rattachement4Code,
          },
          {
            id: fiche5Id,
            jalon: 2025,
            etape_courante: $Enums.etape_evaluation_enum.INSTRUCTION,
            rattachement_code: rattachement5Code,
          },
        ],
      });

      await prisma.etape_evaluation.createMany({
        data: [
          {
            id: etape1Id,
            fiche_evaluation_id: fiche1Id,
            type: $Enums.etape_evaluation_enum.CONSOLIDATION,
            read_only: true,
          },
          {
            id: etape2Id,
            fiche_evaluation_id: fiche2Id,
            type: $Enums.etape_evaluation_enum.CONSOLIDATION,
            read_only: true,
          },
          {
            id: etape3Id,
            fiche_evaluation_id: fiche3Id,
            type: $Enums.etape_evaluation_enum.CONSOLIDATION,
            read_only: false,
          },
          {
            id: etape4Id,
            fiche_evaluation_id: fiche4Id,
            type: $Enums.etape_evaluation_enum.CONSOLIDATION,
            read_only: true,
          },
          {
            id: etape5Id,
            fiche_evaluation_id: fiche5Id,
            type: $Enums.etape_evaluation_enum.INSTRUCTION,
            read_only: true,
          },
        ],
      });

      // When
      await handler.execute({
        ficheEvaluationIds: [fiche1Id, fiche2Id, fiche3Id, fiche5Id],
        readOnly: false,
      });

      // Then
      const etape1Updated = await prisma.etape_evaluation.findUnique({
        where: { id: etape1Id },
      });
      const etape2Updated = await prisma.etape_evaluation.findUnique({
        where: { id: etape2Id },
      });
      const etape3Updated = await prisma.etape_evaluation.findUnique({
        where: { id: etape3Id },
      });
      const etape4Updated = await prisma.etape_evaluation.findUnique({
        where: { id: etape4Id },
      });
      const etape5Updated = await prisma.etape_evaluation.findUnique({
        where: { id: etape5Id },
      });

      expect(etape1Updated?.read_only).toBe(false);
      expect(etape2Updated?.read_only).toBe(false);
      expect(etape3Updated?.read_only).toBe(false);
      expect(etape4Updated?.read_only).toBe(true);
      expect(etape5Updated?.read_only).toBe(true);
    });

    it("doit bloquer plusieurs fiches consolidation en une seule opération", async () => {
      // Given
      const rattachement1Code = "REG-CONSO-06";
      const rattachement2Code = "REG-CONSO-07";
      const rattachement3Code = "REG-CONSO-08";
      const rattachement4Code = "REG-CONSO-09";
      const rattachement5Code = "REG-CONSO-10";

      const fiche1Id = "e1a2b3c4-d5f6-7890-abcd-111111111111";
      const fiche2Id = "e1a2b3c4-d5f6-7890-abcd-222222222222";
      const fiche3Id = "e1a2b3c4-d5f6-7890-abcd-333333333333";
      const fiche4Id = "e1a2b3c4-d5f6-7890-abcd-444444444444";
      const fiche5Id = "e1a2b3c4-d5f6-7890-abcd-555555555555";

      const etape1Id = "f1b2c3d4-e5a6-8901-bcde-111111111111";
      const etape2Id = "f1b2c3d4-e5a6-8901-bcde-222222222222";
      const etape3Id = "f1b2c3d4-e5a6-8901-bcde-333333333333";
      const etape4Id = "f1b2c3d4-e5a6-8901-bcde-444444444444";
      const etape5Id = "f1b2c3d4-e5a6-8901-bcde-555555555555";

      await prisma.referentiel_rattachement.createMany({
        data: [
          { code: rattachement1Code, libelle: "Rattachement bloquer 1" },
          { code: rattachement2Code, libelle: "Rattachement bloquer 2" },
          { code: rattachement3Code, libelle: "Rattachement bloquer 3" },
          { code: rattachement4Code, libelle: "Rattachement bloquer 4" },
          { code: rattachement5Code, libelle: "Rattachement bloquer 5" },
        ],
      });

      await prisma.fiche_evaluation.createMany({
        data: [
          {
            id: fiche1Id,
            jalon: 2025,
            etape_courante: $Enums.etape_evaluation_enum.CONSOLIDATION,
            rattachement_code: rattachement1Code,
          },
          {
            id: fiche2Id,
            jalon: 2025,
            etape_courante: $Enums.etape_evaluation_enum.CONSOLIDATION,
            rattachement_code: rattachement2Code,
          },
          {
            id: fiche3Id,
            jalon: 2025,
            etape_courante: $Enums.etape_evaluation_enum.CONSOLIDATION,
            rattachement_code: rattachement3Code,
          },
          {
            id: fiche4Id,
            jalon: 2025,
            etape_courante: $Enums.etape_evaluation_enum.CONSOLIDATION,
            rattachement_code: rattachement4Code,
          },
          {
            id: fiche5Id,
            jalon: 2025,
            etape_courante: $Enums.etape_evaluation_enum.INSTRUCTION,
            rattachement_code: rattachement5Code,
          },
        ],
      });

      await prisma.etape_evaluation.createMany({
        data: [
          {
            id: etape1Id,
            fiche_evaluation_id: fiche1Id,
            type: $Enums.etape_evaluation_enum.CONSOLIDATION,
            read_only: false,
          },
          {
            id: etape2Id,
            fiche_evaluation_id: fiche2Id,
            type: $Enums.etape_evaluation_enum.CONSOLIDATION,
            read_only: false,
          },
          {
            id: etape3Id,
            fiche_evaluation_id: fiche3Id,
            type: $Enums.etape_evaluation_enum.CONSOLIDATION,
            read_only: true,
          },
          {
            id: etape4Id,
            fiche_evaluation_id: fiche4Id,
            type: $Enums.etape_evaluation_enum.CONSOLIDATION,
            read_only: false,
          },
          {
            id: etape5Id,
            fiche_evaluation_id: fiche5Id,
            type: $Enums.etape_evaluation_enum.INSTRUCTION,
            read_only: false,
          },
        ],
      });

      // When
      await handler.execute({
        ficheEvaluationIds: [fiche1Id, fiche2Id, fiche3Id, fiche5Id],
        readOnly: true,
      });

      // Then
      const etape1Updated = await prisma.etape_evaluation.findUnique({
        where: { id: etape1Id },
      });
      const etape2Updated = await prisma.etape_evaluation.findUnique({
        where: { id: etape2Id },
      });
      const etape3Updated = await prisma.etape_evaluation.findUnique({
        where: { id: etape3Id },
      });
      const etape4Updated = await prisma.etape_evaluation.findUnique({
        where: { id: etape4Id },
      });
      const etape5Updated = await prisma.etape_evaluation.findUnique({
        where: { id: etape5Id },
      });

      expect(etape1Updated?.read_only).toBe(true);
      expect(etape2Updated?.read_only).toBe(true);
      expect(etape3Updated?.read_only).toBe(true);
      expect(etape4Updated?.read_only).toBe(false);
      expect(etape5Updated?.read_only).toBe(false);
    });

    it("ne doit modifier que l'étape CONSOLIDATION et pas les autres étapes", async () => {
      // Given
      const rattachementCode = "REG-CONSO-11";
      const ficheEvaluationId = "504543c1-0393-4084-8c8f-c0ef0fd734eb";
      const etapeAutoId = "86ac5256-c758-4a5a-8656-6f9f954224ad";
      const etapeConsoId = "b09b1d44-bdd4-406b-86bd-96afeb6b7559";
      const etapeInstructionId = "c4d5e6f7-a8b9-0123-4567-123456789012";

      await prisma.referentiel_rattachement.create({
        data: {
          code: rattachementCode,
          libelle: "Rattachement multi-étapes",
        },
      });

      await prisma.fiche_evaluation.create({
        data: {
          id: ficheEvaluationId,
          jalon: 2025,
          etape_courante: $Enums.etape_evaluation_enum.CONSOLIDATION,
          rattachement_code: rattachementCode,
          etape_evaluations: {
            create: [
              {
                id: etapeAutoId,
                type: $Enums.etape_evaluation_enum.AUTO_EVALUATION,
                read_only: true,
              },
              {
                id: etapeConsoId,
                type: $Enums.etape_evaluation_enum.CONSOLIDATION,
                read_only: true,
              },
              {
                id: etapeInstructionId,
                type: $Enums.etape_evaluation_enum.INSTRUCTION,
                read_only: true,
              },
            ],
          },
        },
      });

      // When
      await handler.execute({
        ficheEvaluationIds: [ficheEvaluationId],
        readOnly: false,
      });

      // Then
      const etapeAuto = await prisma.etape_evaluation.findUnique({
        where: { id: etapeAutoId },
      });
      const etapeConso = await prisma.etape_evaluation.findUnique({
        where: { id: etapeConsoId },
      });
      const etapeInstruction = await prisma.etape_evaluation.findUnique({
        where: { id: etapeInstructionId },
      });

      expect(etapeAuto?.read_only).toBe(true);
      expect(etapeConso?.read_only).toBe(false);
      expect(etapeInstruction?.read_only).toBe(true);
    });

    it("ne doit rien faire si la liste de fiches est vide", async () => {
      // Given
      const rattachementCode = "REG-CONSO-12";
      const ficheEvaluationId = "d5e6f7a8-b9c0-1234-5678-123456789012";
      const etapeConsoId = "e6f7a8b9-c0d1-2345-6789-123456789012";

      await prisma.referentiel_rattachement.create({
        data: {
          code: rattachementCode,
          libelle: "Rattachement vide",
        },
      });

      await prisma.fiche_evaluation.create({
        data: {
          id: ficheEvaluationId,
          jalon: 2025,
          etape_courante: $Enums.etape_evaluation_enum.CONSOLIDATION,
          rattachement_code: rattachementCode,
          etape_evaluations: {
            create: {
              id: etapeConsoId,
              type: $Enums.etape_evaluation_enum.CONSOLIDATION,
              read_only: true,
            },
          },
        },
      });

      // When
      await handler.execute({
        ficheEvaluationIds: [],
        readOnly: false,
      });

      // Then
      const etapeConso = await prisma.etape_evaluation.findUnique({
        where: { id: etapeConsoId },
      });

      expect(etapeConso?.read_only).toBe(true);
    });
  });
});
