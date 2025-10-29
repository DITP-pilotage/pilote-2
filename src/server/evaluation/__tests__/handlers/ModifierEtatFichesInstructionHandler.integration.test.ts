import { $Enums } from "@prisma/client";
import { PrismaPilote } from "@/server/db/PrismaPilote";
import { prisma } from "@/server/db/prisma";
import { PrismaTransaction } from "@/server/db/PrismaTransaction";
import { ModifierEtatFichesInstructionHandler } from "@/server/evaluation/handlers/ModifierEtatFichesInstructionHandler";

describe("ModifierEtatFichesInstructionHandler", () => {
  let handler: ModifierEtatFichesInstructionHandler;
  const prismaPilote = new PrismaPilote();
  const transaction = new PrismaTransaction();

  beforeEach(() => {
    handler = new ModifierEtatFichesInstructionHandler({
      prisma: prismaPilote,
      transaction,
    });
  });

  describe("#execute", () => {
    it("doit débloquer plusieurs fiches instruction en une seule opération", async () => {
      // Given
      const rattachement1Code = "REG-INST-01";
      const rattachement2Code = "REG-INST-02";
      const rattachement3Code = "REG-INST-03";
      const rattachement4Code = "REG-INST-04";
      const rattachement5Code = "REG-INST-05";

      const fiche1Id = "a1b2c3d4-e5f6-7890-abcd-111111111111";
      const fiche2Id = "a1b2c3d4-e5f6-7890-abcd-222222222222";
      const fiche3Id = "a1b2c3d4-e5f6-7890-abcd-333333333333";
      const fiche4Id = "a1b2c3d4-e5f6-7890-abcd-444444444444";
      const fiche5Id = "a1b2c3d4-e5f6-7890-abcd-555555555555";

      const etape1Id = "b1c2d3e4-f5a6-8901-bcde-111111111111";
      const etape2Id = "b1c2d3e4-f5a6-8901-bcde-222222222222";
      const etape3Id = "b1c2d3e4-f5a6-8901-bcde-333333333333";
      const etape4Id = "b1c2d3e4-f5a6-8901-bcde-444444444444";
      const etape5Id = "b1c2d3e4-f5a6-8901-bcde-555555555555";

      await prisma.referentiel_rattachement.createMany({
        data: [
          { code: rattachement1Code, libelle: "Rattachement instruction 1" },
          { code: rattachement2Code, libelle: "Rattachement instruction 2" },
          { code: rattachement3Code, libelle: "Rattachement instruction 3" },
          { code: rattachement4Code, libelle: "Rattachement instruction 4" },
          { code: rattachement5Code, libelle: "Rattachement instruction 5" },
        ],
      });

      await prisma.fiche_evaluation.createMany({
        data: [
          {
            id: fiche1Id,
            jalon: 2025,
            etape_courante: $Enums.etape_evaluation_enum.INSTRUCTION,
            rattachement_code: rattachement1Code,
          },
          {
            id: fiche2Id,
            jalon: 2025,
            etape_courante: $Enums.etape_evaluation_enum.INSTRUCTION,
            rattachement_code: rattachement2Code,
          },
          {
            id: fiche3Id,
            jalon: 2025,
            etape_courante: $Enums.etape_evaluation_enum.INSTRUCTION,
            rattachement_code: rattachement3Code,
          },
          {
            id: fiche4Id,
            jalon: 2025,
            etape_courante: $Enums.etape_evaluation_enum.INSTRUCTION,
            rattachement_code: rattachement4Code,
          },
          {
            id: fiche5Id,
            jalon: 2025,
            etape_courante: $Enums.etape_evaluation_enum.CONSOLIDATION,
            rattachement_code: rattachement5Code,
          },
        ],
      });

      await prisma.etape_evaluation.createMany({
        data: [
          {
            id: etape1Id,
            fiche_evaluation_id: fiche1Id,
            type: $Enums.etape_evaluation_enum.INSTRUCTION,
            read_only: true,
          },
          {
            id: etape2Id,
            fiche_evaluation_id: fiche2Id,
            type: $Enums.etape_evaluation_enum.INSTRUCTION,
            read_only: true,
          },
          {
            id: etape3Id,
            fiche_evaluation_id: fiche3Id,
            type: $Enums.etape_evaluation_enum.INSTRUCTION,
            read_only: false,
          },
          {
            id: etape4Id,
            fiche_evaluation_id: fiche4Id,
            type: $Enums.etape_evaluation_enum.INSTRUCTION,
            read_only: true,
          },
          {
            id: etape5Id,
            fiche_evaluation_id: fiche5Id,
            type: $Enums.etape_evaluation_enum.CONSOLIDATION,
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

    it("doit bloquer plusieurs fiches instruction en une seule opération", async () => {
      // Given
      const rattachement1Code = "REG-INST-06";
      const rattachement2Code = "REG-INST-07";
      const rattachement3Code = "REG-INST-08";
      const rattachement4Code = "REG-INST-09";
      const rattachement5Code = "REG-INST-10";

      const fiche1Id = "c1d2e3f4-a5b6-7890-cdef-111111111111";
      const fiche2Id = "c1d2e3f4-a5b6-7890-cdef-222222222222";
      const fiche3Id = "c1d2e3f4-a5b6-7890-cdef-333333333333";
      const fiche4Id = "c1d2e3f4-a5b6-7890-cdef-444444444444";
      const fiche5Id = "c1d2e3f4-a5b6-7890-cdef-555555555555";

      const etape1Id = "d1e2f3a4-b5c6-8901-def1-111111111111";
      const etape2Id = "d1e2f3a4-b5c6-8901-def1-222222222222";
      const etape3Id = "d1e2f3a4-b5c6-8901-def1-333333333333";
      const etape4Id = "d1e2f3a4-b5c6-8901-def1-444444444444";
      const etape5Id = "d1e2f3a4-b5c6-8901-def1-555555555555";

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
            etape_courante: $Enums.etape_evaluation_enum.INSTRUCTION,
            rattachement_code: rattachement1Code,
          },
          {
            id: fiche2Id,
            jalon: 2025,
            etape_courante: $Enums.etape_evaluation_enum.INSTRUCTION,
            rattachement_code: rattachement2Code,
          },
          {
            id: fiche3Id,
            jalon: 2025,
            etape_courante: $Enums.etape_evaluation_enum.INSTRUCTION,
            rattachement_code: rattachement3Code,
          },
          {
            id: fiche4Id,
            jalon: 2025,
            etape_courante: $Enums.etape_evaluation_enum.INSTRUCTION,
            rattachement_code: rattachement4Code,
          },
          {
            id: fiche5Id,
            jalon: 2025,
            etape_courante: $Enums.etape_evaluation_enum.CONSOLIDATION,
            rattachement_code: rattachement5Code,
          },
        ],
      });

      await prisma.etape_evaluation.createMany({
        data: [
          {
            id: etape1Id,
            fiche_evaluation_id: fiche1Id,
            type: $Enums.etape_evaluation_enum.INSTRUCTION,
            read_only: false,
          },
          {
            id: etape2Id,
            fiche_evaluation_id: fiche2Id,
            type: $Enums.etape_evaluation_enum.INSTRUCTION,
            read_only: false,
          },
          {
            id: etape3Id,
            fiche_evaluation_id: fiche3Id,
            type: $Enums.etape_evaluation_enum.INSTRUCTION,
            read_only: true,
          },
          {
            id: etape4Id,
            fiche_evaluation_id: fiche4Id,
            type: $Enums.etape_evaluation_enum.INSTRUCTION,
            read_only: false,
          },
          {
            id: etape5Id,
            fiche_evaluation_id: fiche5Id,
            type: $Enums.etape_evaluation_enum.CONSOLIDATION,
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

    it("ne doit modifier que l'étape INSTRUCTION et pas les autres étapes", async () => {
      // Given
      const rattachementCode = "REG-INST-11";
      const ficheEvaluationId = "e1f2a3b4-c5d6-7890-ef12-123456789012";
      const etapeAutoId = "f1a2b3c4-d5e6-8901-f123-123456789012";
      const etapeConsoId = "a2b3c4d5-e6f7-9012-1234-123456789012";
      const etapeInstructionId = "b3c4d5e6-f7a8-0123-2345-123456789012";

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
          etape_courante: $Enums.etape_evaluation_enum.INSTRUCTION,
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
      expect(etapeConso?.read_only).toBe(true);
      expect(etapeInstruction?.read_only).toBe(false);
    });

    it("ne doit rien faire si la liste de fiches est vide", async () => {
      // Given
      const rattachementCode = "REG-INST-12";
      const ficheEvaluationId = "c3d4e5f6-a7b8-9012-3456-123456789012";
      const etapeInstructionId = "d4e5f6a7-b8c9-0123-4567-123456789012";

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
          etape_courante: $Enums.etape_evaluation_enum.INSTRUCTION,
          rattachement_code: rattachementCode,
          etape_evaluations: {
            create: {
              id: etapeInstructionId,
              type: $Enums.etape_evaluation_enum.INSTRUCTION,
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
      const etapeInstruction = await prisma.etape_evaluation.findUnique({
        where: { id: etapeInstructionId },
      });

      expect(etapeInstruction?.read_only).toBe(true);
    });
  });
});
