import { $Enums } from "@prisma/client";
import { DebloquerFichesConsolidationHandler } from "@/server/evaluation/handlers/DebloquerFichesConsolidationHandler";
import { PrismaPilote } from "@/server/db/PrismaPilote";
import { prisma } from "@/server/db/prisma";
import { PrismaTransaction } from "@/server/db/PrismaTransaction";

describe("DebloquerFichesConsolidationHandler", () => {
  let handler: DebloquerFichesConsolidationHandler;
  const prismaPilote = new PrismaPilote();
  const transaction = new PrismaTransaction();

  beforeEach(() => {
    handler = new DebloquerFichesConsolidationHandler({
      prisma: prismaPilote,
      transaction,
    });
  });

  describe("#execute", () => {
    it("doit débloquer plusieurs fiches en une seule opération", async () => {
      // Given
      const rattachement1Code = "REG-TEST-01";
      const rattachement2Code = "REG-TEST-02";
      const rattachement3Code = "REG-TEST-03";
      const rattachement4Code = "REG-TEST-04";
      const rattachement5Code = "REG-TEST-05";

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
          {
            code: rattachement1Code,
            libelle: "Rattachement test 1",
            groupe: rattachement1Code,
            ordre: 1,
          },
          {
            code: rattachement2Code,
            libelle: "Rattachement test 2",
            groupe: rattachement2Code,
            ordre: 1,
          },
          {
            code: rattachement3Code,
            libelle: "Rattachement test 3",
            groupe: rattachement3Code,
            ordre: 1,
          },
          {
            code: rattachement4Code,
            libelle: "Rattachement test 4",
            groupe: rattachement4Code,
            ordre: 1,
          },
          {
            code: rattachement5Code,
            libelle: "Rattachement test 5",
            groupe: rattachement5Code,
            ordre: 1,
          },
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
            etape_courante: $Enums.etape_evaluation_enum.AUTO_EVALUATION,
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
            type: $Enums.etape_evaluation_enum.AUTO_EVALUATION,
            read_only: true,
          },
        ],
      });

      // When
      await handler.execute({
        ficheEvaluationIds: [fiche1Id, fiche2Id, fiche3Id, fiche5Id],
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

    it("ne doit débloquer que l'étape de consolidation et pas les autres étapes", async () => {
      // Given
      const rattachementCode = "REG-TEST-05";
      const ficheEvaluationId = "504543c1-0393-4084-8c8f-c0ef0fd734eb";
      const etapeAutoId = "86ac5256-c758-4a5a-8656-6f9f954224ad";
      const etapeConsoId = "b09b1d44-bdd4-406b-86bd-96afeb6b7559";

      await prisma.referentiel_rattachement.create({
        data: {
          code: rattachementCode,
          libelle: "Rattachement multi-étapes",
          groupe: rattachementCode,
          ordre: 1,
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
                id: etapeAutoId,
                type: "AUTO_EVALUATION",
                read_only: true,
              },
              {
                id: etapeConsoId,
                type: "CONSOLIDATION",
                read_only: true,
              },
            ],
          },
        },
      });

      // When
      await handler.execute({ ficheEvaluationIds: [ficheEvaluationId] });

      // Then
      const etapeAuto = await prisma.etape_evaluation.findUnique({
        where: { id: etapeAutoId },
      });
      const etapeConso = await prisma.etape_evaluation.findUnique({
        where: { id: etapeConsoId },
      });

      expect(etapeAuto?.read_only).toBe(true);
      expect(etapeConso?.read_only).toBe(false);
    });
  });
});
