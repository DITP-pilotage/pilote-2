import { $Enums } from "@prisma/client";
import { ModifierDroitsUtilisateurHandler } from "@/server/evaluation/handlers/ModifierDroitsUtilisateurHandler";
import { prisma } from "@/server/db/prisma";
import { PrismaPilote } from "@/server/db/PrismaPilote";
import { PrismaTransaction } from "@/server/db/PrismaTransaction";

describe("ModifierDroitsUtilisateurHandler", () => {
  let handler: ModifierDroitsUtilisateurHandler;
  const prismaPilote = new PrismaPilote();
  const transaction = new PrismaTransaction();
  let utilisateurId: string;
  const critereId1 = "178261fb-cfa3-4559-8b3a-1f7efb4bd559";
  const critereId2 = "3a46e36a-051f-46b9-b35a-38121e09e8f6";
  const critereId3 = "23d32811-5223-44f0-8f3b-2a9ae1b34c90";
  const objectifId1 = "9da92e0d-a0f6-4e29-b9a4-f3e44dab46c1";
  const objectifId2 = "cee4001c-7ec6-4627-8b52-e8b2abf8a54a";
  const objectifId3 = "74fa69bb-4fec-47a6-8e70-37ffb68b1bbf";
  const objectifId4 = "08c74b75-8caf-4c12-bd2f-edae49df67d5";

  beforeEach(async () => {
    handler = new ModifierDroitsUtilisateurHandler({
      transaction,
      prisma: prismaPilote,
    });

    const utilisateur = await prisma.utilisateur.create({
      data: {
        email: "test-modifier-droits@example.com",
        nom: "Test",
        prenom: "User",
        profilCode: "DITP_ADMIN",
        applications_accessibles: [$Enums.application_accessible.PILOTE_EVAL],
        date_creation: new Date(),
      },
    });
    utilisateurId = utilisateur.id;

    await prisma.referentiel_rattachement.createMany({
      data: [
        { code: "REG-01", libelle: "Région 01", groupe: "Régions", ordre: 1 },
        { code: "REG-02", libelle: "Région 02", groupe: "Régions", ordre: 2 },
        { code: "REG-03", libelle: "Région 03", groupe: "Régions", ordre: 3 },
      ],
      skipDuplicates: true,
    });

    await prisma.referentiel_critere.createMany({
      data: [
        {
          id: critereId1,
          libelle: "Critère 1",
          descriptif: "Description du critère 1",
        },
        {
          id: critereId2,
          libelle: "Critère 2",
          descriptif: "Description du critère 2",
        },
        {
          id: critereId3,
          libelle: "Critère 3",
          descriptif: "Description critère 3",
        },
      ],
      skipDuplicates: true,
    });

    await prisma.referentiel_objectif.createMany({
      data: [
        {
          id: objectifId1,
          libelle: "Objectif 1 - REG-01",
          descriptif: "Description objectif 1",
          indicateur_cible: "100",
          jalon: 2025,
          rattachement_code: "REG-01",
        },
        {
          id: objectifId2,
          libelle: "Objectif 2 - REG-01",
          descriptif: "Description objectif 2",
          indicateur_cible: "200",
          jalon: 2025,
          rattachement_code: "REG-01",
        },
        {
          id: objectifId3,
          libelle: "Objectif 1 - REG-02",
          descriptif: "Description objectif 1",
          indicateur_cible: "150",
          jalon: 2025,
          rattachement_code: "REG-02",
        },
        {
          id: objectifId4,
          libelle: "Objectif 1 - REG-03",
          descriptif: "Description objectif 1",
          indicateur_cible: "150",
          jalon: 2025,
          rattachement_code: "REG-03",
        },
      ],
    });
  });

  describe("execute", () => {
    it("crée les rattachements pour l'auto-évaluation", async () => {
      // Given
      const command = {
        utilisateurId,
        jalon: 2025,
        autoEvaluation: {
          rattachementCodes: ["REG-01", "REG-02"],
        },
        consolidation: {
          rattachementCodes: [],
        },
        instructionObjectifs: {
          rattachementCodes: [],
        },
        instructionManiereDeServir: {
          critereCodes: [],
        },
      };

      // When
      await handler.execute(command);

      // Then
      const rattachements =
        await prisma.rattachement_utilisateur_etape_jalon.findMany({
          where: {
            utilisateur_id: utilisateurId,
            jalon: 2025,
            etape: $Enums.etape_evaluation_enum.AUTO_EVALUATION,
          },
        });

      expect(rattachements).toHaveLength(2);
      expect(rattachements.map((r) => r.rattachement_code)).toEqual(
        expect.arrayContaining(["REG-01", "REG-02"]),
      );
    });

    it("crée les rattachements pour la consolidation", async () => {
      // Given: une commande avec 1 rattachement en consolidation
      const command = {
        utilisateurId,
        jalon: 2025,
        autoEvaluation: {
          rattachementCodes: [],
        },
        consolidation: {
          rattachementCodes: ["REG-03"],
        },
        instructionObjectifs: {
          rattachementCodes: [],
        },
        instructionManiereDeServir: {
          critereCodes: [],
        },
      };

      // When
      await handler.execute(command);

      // Then
      const rattachements =
        await prisma.rattachement_utilisateur_etape_jalon.findMany({
          where: {
            utilisateur_id: utilisateurId,
            jalon: 2025,
            etape: $Enums.etape_evaluation_enum.CONSOLIDATION,
          },
        });

      expect(rattachements).toHaveLength(1);
      expect(rattachements[0].rattachement_code).toBe("REG-03");
    });

    it("supprime les anciens rattachements et crée les nouveaux", async () => {
      // Given: un rattachement existant en auto-évaluation
      await prisma.rattachement_utilisateur_etape_jalon.create({
        data: {
          id: "a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d",
          utilisateur_id: utilisateurId,
          rattachement_code: "REG-01",
          etape: $Enums.etape_evaluation_enum.AUTO_EVALUATION,
          jalon: 2025,
        },
      });

      const command = {
        utilisateurId,
        jalon: 2025,
        autoEvaluation: {
          rattachementCodes: ["REG-02", "REG-03"],
        },
        consolidation: {
          rattachementCodes: [],
        },
        instructionObjectifs: {
          rattachementCodes: [],
        },
        instructionManiereDeServir: {
          critereCodes: [],
        },
      };

      // When
      await handler.execute(command);

      // Then
      const rattachements =
        await prisma.rattachement_utilisateur_etape_jalon.findMany({
          where: {
            utilisateur_id: utilisateurId,
            jalon: 2025,
            etape: $Enums.etape_evaluation_enum.AUTO_EVALUATION,
          },
        });

      expect(rattachements).toHaveLength(2);
      expect(rattachements.map((r) => r.rattachement_code)).toEqual(
        expect.arrayContaining(["REG-02", "REG-03"]),
      );
      expect(rattachements.map((r) => r.rattachement_code)).not.toContain(
        "REG-01",
      );
    });

    it("ne supprime que les rattachements du jalon spécifié", async () => {
      // Given: des rattachements pour 2025 et 2024
      await prisma.rattachement_utilisateur_etape_jalon.create({
        data: {
          id: "a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d",
          utilisateur_id: utilisateurId,
          rattachement_code: "REG-01",
          etape: $Enums.etape_evaluation_enum.AUTO_EVALUATION,
          jalon: 2025,
        },
      });
      await prisma.rattachement_utilisateur_etape_jalon.create({
        data: {
          id: "b2c3d4e5-f6a7-4b5c-9d0e-1f2a3b4c5d6e",
          utilisateur_id: utilisateurId,
          rattachement_code: "REG-02",
          etape: $Enums.etape_evaluation_enum.AUTO_EVALUATION,
          jalon: 2024,
        },
      });

      const command = {
        utilisateurId,
        jalon: 2025,
        autoEvaluation: {
          rattachementCodes: ["REG-03"],
        },
        consolidation: {
          rattachementCodes: [],
        },
        instructionObjectifs: {
          rattachementCodes: [],
        },
        instructionManiereDeServir: {
          critereCodes: [],
        },
      };

      // When
      await handler.execute(command);

      // Then
      const rattachement2024 =
        await prisma.rattachement_utilisateur_etape_jalon.findFirst({
          where: {
            utilisateur_id: utilisateurId,
            jalon: 2024,
          },
        });

      expect(rattachement2024).not.toBeNull();
      expect(rattachement2024?.rattachement_code).toBe("REG-02");
    });

    it("Supprime tous les droits en passant des tableaux vides", async () => {
      // Given: des rattachements existants
      await prisma.rattachement_utilisateur_etape_jalon.createMany({
        data: [
          {
            id: "a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d",
            utilisateur_id: utilisateurId,
            rattachement_code: "REG-01",
            etape: $Enums.etape_evaluation_enum.AUTO_EVALUATION,
            jalon: 2025,
          },
          {
            id: "f313b9cf-0a14-496c-9d71-31db80406d69",
            utilisateur_id: utilisateurId,
            rattachement_code: "REG-01",
            etape: $Enums.etape_evaluation_enum.CONSOLIDATION,
            jalon: 2025,
          },
        ],
      });

      const command = {
        utilisateurId,
        jalon: 2025,
        autoEvaluation: {
          rattachementCodes: [],
        },
        consolidation: {
          rattachementCodes: [],
        },
        instructionObjectifs: {
          rattachementCodes: [],
        },
        instructionManiereDeServir: {
          critereCodes: [],
        },
      };

      // When
      await handler.execute(command);

      // Then
      const rattachements =
        await prisma.rattachement_utilisateur_etape_jalon.findMany({
          where: {
            utilisateur_id: utilisateurId,
            jalon: 2025,
          },
        });

      expect(rattachements).toHaveLength(0);
    });

    it("Donne accès à tous les rattachements en instruction et aux critères donnés lorsque des critères sont fournis", async () => {
      // Given: une commande avec 2 critères
      const command = {
        utilisateurId,
        jalon: 2025,
        autoEvaluation: {
          rattachementCodes: [],
        },
        consolidation: {
          rattachementCodes: [],
        },
        instructionObjectifs: {
          rattachementCodes: [],
        },
        instructionManiereDeServir: {
          critereCodes: [critereId1, critereId2],
        },
      };

      // When
      await handler.execute(command);

      // Then
      const rattachementsEtapes =
        await prisma.rattachement_utilisateur_etape_jalon.findMany({
          where: {
            utilisateur_id: utilisateurId,
            jalon: 2025,
            etape: $Enums.etape_evaluation_enum.INSTRUCTION,
          },
        });

      const criteresInstruction = await prisma.instruction_critere.findMany({
        where: {
          rattachement_utilisateur_etape_jalon: {
            utilisateur_id: utilisateurId,
            jalon: 2025,
            etape: $Enums.etape_evaluation_enum.INSTRUCTION,
          },
        },
      });

      expect(rattachementsEtapes).toHaveLength(3);
      expect(
        rattachementsEtapes.map(
          (rattachementEtape) => rattachementEtape.rattachement_code,
        ),
      ).toEqual(expect.arrayContaining(["REG-01", "REG-02", "REG-03"]));

      expect(criteresInstruction).toHaveLength(6);
      for (const rattachementEtape of rattachementsEtapes) {
        const criteresInstructionRattachement = criteresInstruction.filter(
          (critereInstruction) =>
            critereInstruction.rattachement_utilisateur_etape_jalon_id ===
            rattachementEtape.id,
        );
        expect(criteresInstructionRattachement).toHaveLength(2);
        expect(
          criteresInstructionRattachement.map(
            (critereInstruction) => critereInstruction.critere_id,
          ),
        ).toEqual(expect.arrayContaining([critereId1, critereId2]));
      }
    });

    it("cree uniquement les rattachements selectionnes en instruction quand seuls des objectifs sont choisis et donne accès aux objectifs associés aux rattachements", async () => {
      // Given: une commande avec des objectifs mais pas de criteres
      const command = {
        utilisateurId,
        jalon: 2025,
        autoEvaluation: {
          rattachementCodes: [],
        },
        consolidation: {
          rattachementCodes: [],
        },
        instructionObjectifs: {
          rattachementCodes: ["REG-01", "REG-02"],
        },
        instructionManiereDeServir: {
          critereCodes: [],
        },
      };

      // When
      await handler.execute(command);

      // Then
      const rattachementsEtapes =
        await prisma.rattachement_utilisateur_etape_jalon.findMany({
          where: {
            utilisateur_id: utilisateurId,
            jalon: 2025,
            etape: $Enums.etape_evaluation_enum.INSTRUCTION,
          },
        });

      const objectifsInstruction = await prisma.instruction_objectif.findMany(
        {},
      );

      expect(rattachementsEtapes).toHaveLength(2);
      expect(
        rattachementsEtapes.map(
          (rattachementEtape) => rattachementEtape.rattachement_code,
        ),
      ).toEqual(expect.arrayContaining(["REG-01", "REG-02"]));

      const rattachementEtapeReg01 = rattachementsEtapes.find(
        (rattachementEtape) => rattachementEtape.rattachement_code === "REG-01",
      );
      const rattachementEtapeReg02 = rattachementsEtapes.find(
        (rattachementEtape) => rattachementEtape.rattachement_code === "REG-02",
      );

      const objectifsInstructionReg01 = objectifsInstruction.filter(
        (objectifInstruction) =>
          objectifInstruction.rattachement_utilisateur_etape_jalon_id ===
          rattachementEtapeReg01!.id,
      );

      const objectifsInstructionReg02 = objectifsInstruction.filter(
        (objectifInstruction) =>
          objectifInstruction.rattachement_utilisateur_etape_jalon_id ===
          rattachementEtapeReg02!.id,
      );

      expect(objectifsInstructionReg01).toHaveLength(2);
      expect(
        objectifsInstructionReg01.map((objectif) => objectif.objectif_id),
      ).toEqual(expect.arrayContaining([objectifId1, objectifId2]));
      expect(objectifsInstructionReg02).toHaveLength(1);
      expect(
        objectifsInstructionReg02.map((objectif) => objectif.objectif_id),
      ).toEqual(expect.arrayContaining([objectifId3]));
    });

    it("gere le cas où des objectifs et des criteres sont selectionnes", async () => {
      // Given: une commande avec des objectifs ET des criteres
      const command = {
        utilisateurId,
        jalon: 2025,
        autoEvaluation: {
          rattachementCodes: [],
        },
        consolidation: {
          rattachementCodes: [],
        },
        instructionObjectifs: {
          rattachementCodes: ["REG-01"],
        },
        instructionManiereDeServir: {
          critereCodes: [critereId1],
        },
      };

      // When
      await handler.execute(command);

      // Then: tous les rattachements doivent etre crees
      const rattachements =
        await prisma.rattachement_utilisateur_etape_jalon.findMany({
          where: {
            utilisateur_id: utilisateurId,
            jalon: 2025,
            etape: $Enums.etape_evaluation_enum.INSTRUCTION,
          },
        });
      const instructionCriteres = await prisma.instruction_critere.findMany({});
      const instructionObjectifs = await prisma.instruction_objectif.findMany(
        {},
      );

      expect(rattachements).toHaveLength(3);
      expect(rattachements.map((r) => r.rattachement_code)).toEqual(
        expect.arrayContaining(["REG-01", "REG-02", "REG-03"]),
      );
      expect(instructionCriteres).toHaveLength(3);
      expect(instructionObjectifs).toHaveLength(2);
    });
  });
});
