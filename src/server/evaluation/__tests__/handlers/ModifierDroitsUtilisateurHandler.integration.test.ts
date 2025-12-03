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
  });
});
