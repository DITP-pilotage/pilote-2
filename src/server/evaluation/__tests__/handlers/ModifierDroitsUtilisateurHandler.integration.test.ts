import { $Enums } from "@prisma/client";
import { randomUUID } from "node:crypto";
import { ModifierDroitsUtilisateurHandler } from "@/server/evaluation/handlers/ModifierDroitsUtilisateurHandler";
import { prisma } from "@/server/db/prisma";
import { PrismaPilote } from "@/server/db/PrismaPilote";
import { PrismaTransaction } from "@/server/db/PrismaTransaction";

describe("ModifierDroitsUtilisateurHandler", () => {
  let handler: ModifierDroitsUtilisateurHandler;
  const prismaPilote = new PrismaPilote();
  const transaction = new PrismaTransaction();
  let utilisateurId: string;

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
          id: "9c60b99a-d716-49dc-b4d5-5a739f241a78",
          libelle: "Critère 1",
          descriptif: "Description du critère 1",
        },
        {
          id: "3ec335a1-0737-4ddf-bdf1-11aa7d7f41fa",
          libelle: "Critère 2",
          descriptif: "Description du critère 2",
        },
      ],
      skipDuplicates: true,
    });

    await prisma.referentiel_objectif.createMany({
      data: [
        {
          id: "f1a2b3c4-d5e6-4a5b-8c9d-0e1f2a3b4c5d",
          libelle: "Objectif 1 - REG-01",
          descriptif: "Description objectif 1",
          indicateur_cible: "100",
          jalon: 2025,
          rattachement_code: "REG-01",
        },
        {
          id: "f2a2b3c4-d5e6-4a5b-8c9d-0e1f2a3b4c5d",
          libelle: "Objectif 2 - REG-01",
          descriptif: "Description objectif 2",
          indicateur_cible: "200",
          jalon: 2025,
          rattachement_code: "REG-01",
        },
        {
          id: "f3a2b3c4-d5e6-4a5b-8c9d-0e1f2a3b4c5d",
          libelle: "Objectif 1 - REG-02",
          descriptif: "Description objectif 1",
          indicateur_cible: "150",
          jalon: 2025,
          rattachement_code: "REG-02",
        },
      ],
      skipDuplicates: true,
    });
  });

  describe("execute", () => {
    it("crée les rattachements pour l'auto-évaluation", async () => {
      // Given: une commande avec 2 rattachements en auto-évaluation
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

      // Then: le rattachement 2024 doit toujours exister
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

    it("permet de supprimer tous les droits en passant des tableaux vides", async () => {
      // Given: des rattachements existants
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

    it("crée tous les rattachements en instruction et les critères lorsque des critères sont fournis", async () => {
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
          critereCodes: [
            "9c60b99a-d716-49dc-b4d5-5a739f241a78",
            "3ec335a1-0737-4ddf-bdf1-11aa7d7f41fa",
          ],
        },
      };

      // When
      await handler.execute(command);

      // Then: tous les rattachements doivent être créés pour l'instruction
      const rattachements =
        await prisma.rattachement_utilisateur_etape_jalon.findMany({
          where: {
            utilisateur_id: utilisateurId,
            jalon: 2025,
            etape: $Enums.etape_evaluation_enum.INSTRUCTION,
          },
        });

      expect(rattachements).toHaveLength(3);
      expect(rattachements.map((r) => r.rattachement_code)).toEqual(
        expect.arrayContaining(["REG-01", "REG-02", "REG-03"]),
      );

      // Then: les critères doivent être créés
      const criteres = await prisma.instruction_critere.findMany({
        where: {
          rattachement_utilisateur_etape_jalon: {
            utilisateur_id: utilisateurId,
            jalon: 2025,
            etape: $Enums.etape_evaluation_enum.INSTRUCTION,
          },
        },
      });

      expect(criteres).toHaveLength(6);
      const criteresParRattachement = criteres.reduce(
        (acc, c) => {
          if (!acc[c.rattachement_utilisateur_etape_jalon_id])
            acc[c.rattachement_utilisateur_etape_jalon_id] = [];
          acc[c.rattachement_utilisateur_etape_jalon_id].push(c.critere_id);
          return acc;
        },
        {} as Record<string, string[]>,
      );

      Object.values(criteresParRattachement).forEach((criteresIds) => {
        expect(criteresIds).toEqual(
          expect.arrayContaining([
            "9c60b99a-d716-49dc-b4d5-5a739f241a78",
            "3ec335a1-0737-4ddf-bdf1-11aa7d7f41fa",
          ]),
        );
      });
    });

    it("supprime les rattachements instruction et critères existants lorsqu'aucun critère n'est fourni", async () => {
      // Given: des rattachements et critères existants en instruction
      const rattachement =
        await prisma.rattachement_utilisateur_etape_jalon.create({
          data: {
            id: "a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d",
            utilisateur_id: utilisateurId,
            rattachement_code: "REG-01",
            etape: $Enums.etape_evaluation_enum.INSTRUCTION,
            jalon: 2025,
          },
        });

      await prisma.instruction_critere.create({
        data: {
          id: randomUUID(),
          rattachement_utilisateur_etape_jalon_id: rattachement.id,
          critere_id: "9c60b99a-d716-49dc-b4d5-5a739f241a78",
        },
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

      // Then: les rattachements instruction doivent être supprimés
      const rattachements =
        await prisma.rattachement_utilisateur_etape_jalon.findMany({
          where: {
            utilisateur_id: utilisateurId,
            jalon: 2025,
            etape: $Enums.etape_evaluation_enum.INSTRUCTION,
          },
        });

      expect(rattachements).toHaveLength(0);

      // Then: les critères doivent être supprimés (cascade)
      const criteres = await prisma.instruction_critere.findMany({
        where: {
          rattachement_utilisateur_etape_jalon_id: rattachement.id,
        },
      });

      expect(criteres).toHaveLength(0);
    });

    it("remplace les critères existants par les nouveaux", async () => {
      // Given: un rattachement avec un critère existant
      const rattachement =
        await prisma.rattachement_utilisateur_etape_jalon.create({
          data: {
            id: "a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d",
            utilisateur_id: utilisateurId,
            rattachement_code: "REG-01",
            etape: $Enums.etape_evaluation_enum.INSTRUCTION,
            jalon: 2025,
          },
        });

      await prisma.instruction_critere.create({
        data: {
          id: randomUUID(),
          rattachement_utilisateur_etape_jalon_id: rattachement.id,
          critere_id: "9c60b99a-d716-49dc-b4d5-5a739f241a78",
        },
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
          critereCodes: ["3ec335a1-0737-4ddf-bdf1-11aa7d7f41fa"],
        },
      };

      // When
      await handler.execute(command);

      // Then: tous les rattachements doivent être créés
      const rattachements =
        await prisma.rattachement_utilisateur_etape_jalon.findMany({
          where: {
            utilisateur_id: utilisateurId,
            jalon: 2025,
            etape: $Enums.etape_evaluation_enum.INSTRUCTION,
          },
        });

      expect(rattachements).toHaveLength(3);

      // Then: seul le nouveau critère doit être présent
      const criteres = await prisma.instruction_critere.findMany({
        where: {
          rattachement_utilisateur_etape_jalon: {
            utilisateur_id: utilisateurId,
            jalon: 2025,
            etape: $Enums.etape_evaluation_enum.INSTRUCTION,
          },
        },
      });

      expect(criteres).toHaveLength(3);
      criteres.forEach((c) => {
        expect(c.critere_id).toBe("3ec335a1-0737-4ddf-bdf1-11aa7d7f41fa");
      });
    });

    it("cree uniquement les rattachements selectionnes quand seuls des objectifs sont choisis", async () => {
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

      // Then: seuls les rattachements selectionnes doivent etre crees
      const rattachements =
        await prisma.rattachement_utilisateur_etape_jalon.findMany({
          where: {
            utilisateur_id: utilisateurId,
            jalon: 2025,
            etape: $Enums.etape_evaluation_enum.INSTRUCTION,
          },
        });

      expect(rattachements).toHaveLength(2);
      expect(rattachements.map((r) => r.rattachement_code)).toEqual(
        expect.arrayContaining(["REG-01", "REG-02"]),
      );
    });

    it("cree tous les rattachements quand objectifs ET criteres sont selectionnes", async () => {
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
          critereCodes: ["9c60b99a-d716-49dc-b4d5-5a739f241a78"],
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

      expect(rattachements).toHaveLength(3);
      expect(rattachements.map((r) => r.rattachement_code)).toEqual(
        expect.arrayContaining(["REG-01", "REG-02", "REG-03"]),
      );
    });

    it("cree les objectifs d'instruction pour les rattachements selectionnes", async () => {
      // Given: une commande avec des objectifs
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

      // Then: les objectifs doivent etre crees
      const objectifs = await prisma.instruction_objectif.findMany({
        where: {
          rattachement_utilisateur_etape_jalon: {
            utilisateur_id: utilisateurId,
            jalon: 2025,
            etape: $Enums.etape_evaluation_enum.INSTRUCTION,
          },
        },
        include: {
          objectif: true,
        },
      });

      expect(objectifs).toHaveLength(3);
      const objectifIds = objectifs.map((o) => o.objectif_id);
      expect(objectifIds).toEqual(
        expect.arrayContaining([
          "f1a2b3c4-d5e6-4a5b-8c9d-0e1f2a3b4c5d",
          "f2a2b3c4-d5e6-4a5b-8c9d-0e1f2a3b4c5d",
          "f3a2b3c4-d5e6-4a5b-8c9d-0e1f2a3b4c5d",
        ]),
      );
    });
  });
});
