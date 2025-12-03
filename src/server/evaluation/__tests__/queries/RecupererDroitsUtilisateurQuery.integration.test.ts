import { $Enums } from "@prisma/client";
import { RecupererDroitsUtilisateurQuery } from "@/server/evaluation/queries/RecupererDroitsUtilisateurQuery";
import { prisma } from "@/server/db/prisma";
import { PrismaPilote } from "@/server/db/PrismaPilote";

describe("RecupererDroitsUtilisateurQuery", () => {
  let query: RecupererDroitsUtilisateurQuery;
  const prismaPilote = new PrismaPilote();
  let utilisateurId: string;

  beforeEach(async () => {
    query = new RecupererDroitsUtilisateurQuery({ prisma: prismaPilote });

    const utilisateur = await prisma.utilisateur.create({
      data: {
        email: "test-droits@example.com",
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
        { code: "REG-04", libelle: "Région 04", groupe: "Régions", ordre: 4 },
        { code: "REG-05", libelle: "Région 05", groupe: "Régions", ordre: 5 },
        { code: "REG-06", libelle: "Région 06", groupe: "Régions", ordre: 6 },
        { code: "REG-07", libelle: "Région 07", groupe: "Régions", ordre: 7 },
      ],
      skipDuplicates: true,
    });

    await prisma.referentiel_objectif.createMany({
      data: [
        {
          id: "f1a2b3c4-d5e6-4a5b-8c9d-0e1f2a3b4c5d",
          libelle: "Objectif 1 - REG-04",
          descriptif: "Description objectif 1",
          indicateur_cible: "100",
          jalon: 2025,
          rattachement_code: "REG-04",
        },
        {
          id: "f2a2b3c4-d5e6-4a5b-8c9d-0e1f2a3b4c5d",
          libelle: "Objectif 1 - REG-05",
          descriptif: "Description objectif 2",
          indicateur_cible: "200",
          jalon: 2025,
          rattachement_code: "REG-05",
        },
      ],
      skipDuplicates: true,
    });
  });

  describe("run", () => {
    it("retourne les rattachements pour AUTO_EVALUATION", async () => {
      // Given: 2 rattachements en auto-évaluation pour le jalon 2025
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
          jalon: 2025,
        },
      });

      // When
      const resultat = await query.run({
        utilisateurId,
        jalon: 2025,
      });

      // Then
      expect(resultat.autoEvaluation.rattachementCodes).toEqual(
        expect.arrayContaining(["REG-01", "REG-02"]),
      );
    });

    it("retourne les rattachements pour CONSOLIDATION", async () => {
      // Given: 1 rattachement en consolidation pour le jalon 2025
      await prisma.rattachement_utilisateur_etape_jalon.create({
        data: {
          id: "c3d4e5f6-a7b8-4c5d-9e0f-2a3b4c5d6e7f",
          utilisateur_id: utilisateurId,
          rattachement_code: "REG-03",
          etape: $Enums.etape_evaluation_enum.CONSOLIDATION,
          jalon: 2025,
        },
      });

      // When
      const resultat = await query.run({
        utilisateurId,
        jalon: 2025,
      });

      // Then
      expect(resultat.consolidation.rattachementCodes).toEqual(["REG-03"]);
    });

    it("retourne les rattachements pour INSTRUCTION avec objectifs", async () => {
      // Given: 1 rattachement en instruction avec un objectif
      const rattachementInstruction =
        await prisma.rattachement_utilisateur_etape_jalon.create({
          data: {
            id: "d4e5f6a7-b8c9-4d5e-0f1a-3b4c5d6e7f8a",
            utilisateur_id: utilisateurId,
            rattachement_code: "REG-04",
            etape: $Enums.etape_evaluation_enum.INSTRUCTION,
            jalon: 2025,
          },
        });

      await prisma.instruction_objectif.create({
        data: {
          id: "a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d",
          rattachement_utilisateur_etape_jalon_id: rattachementInstruction.id,
          objectif_id: "f1a2b3c4-d5e6-4a5b-8c9d-0e1f2a3b4c5d",
        },
      });

      // When
      const resultat = await query.run({
        utilisateurId,
        jalon: 2025,
      });

      // Then
      expect(resultat.instructionObjectifs.rattachementCodes).toEqual([
        "REG-04",
      ]);
    });

    it("ne retourne pas les rattachements INSTRUCTION sans objectifs", async () => {
      // Given: 1 rattachement en instruction sans objectif
      await prisma.rattachement_utilisateur_etape_jalon.create({
        data: {
          id: "e5f6a7b8-c9d0-4e5f-1a2b-4c5d6e7f8a9b",
          utilisateur_id: utilisateurId,
          rattachement_code: "REG-06",
          etape: $Enums.etape_evaluation_enum.INSTRUCTION,
          jalon: 2025,
        },
      });

      // When
      const resultat = await query.run({
        utilisateurId,
        jalon: 2025,
      });

      // Then
      expect(resultat.instructionObjectifs.rattachementCodes).toEqual([]);
    });

    it("retourne les rattachementCodes des objectifs et non du rattachement utilisateur", async () => {
      // Given: 1 rattachement_utilisateur_etape_jalon avec code REG-07
      // mais avec 2 instruction_objectif lies a des referentiel_objectif ayant rattachement_code REG-04 et REG-05
      const rattachementInstruction =
        await prisma.rattachement_utilisateur_etape_jalon.create({
          data: {
            id: "f6a7b8c9-d0e1-4f5a-2b3c-5d6e7f8a9b0c",
            utilisateur_id: utilisateurId,
            rattachement_code: "REG-07",
            etape: $Enums.etape_evaluation_enum.INSTRUCTION,
            jalon: 2025,
          },
        });

      // Objectif f1a2b3c4 a rattachement_code: REG-04
      await prisma.instruction_objectif.create({
        data: {
          id: "b1c2d3e4-f5a6-4b5c-9d0e-1f2a3b4c5d6e",
          rattachement_utilisateur_etape_jalon_id: rattachementInstruction.id,
          objectif_id: "f1a2b3c4-d5e6-4a5b-8c9d-0e1f2a3b4c5d",
        },
      });

      // Objectif f2a2b3c4 a rattachement_code: REG-05
      await prisma.instruction_objectif.create({
        data: {
          id: "c2d3e4f5-a6b7-4c5d-0e1f-2a3b4c5d6e7f",
          rattachement_utilisateur_etape_jalon_id: rattachementInstruction.id,
          objectif_id: "f2a2b3c4-d5e6-4a5b-8c9d-0e1f2a3b4c5d",
        },
      });

      // When
      const resultat = await query.run({
        utilisateurId,
        jalon: 2025,
      });

      // Then: doit retourner REG-04 et REG-05 (rattachement_code des objectifs)
      // et PAS REG-07 (rattachement_code du rattachement_utilisateur_etape_jalon)
      expect(resultat.instructionObjectifs.rattachementCodes).toHaveLength(2);
      expect(resultat.instructionObjectifs.rattachementCodes).toEqual(
        expect.arrayContaining(["REG-04", "REG-05"]),
      );
      expect(resultat.instructionObjectifs.rattachementCodes).not.toContain(
        "REG-07",
      );
    });

    it("retourne les critères pour INSTRUCTION", async () => {
      // Given: 1 rattachement en instruction avec 2 critères
      const rattachementInstruction =
        await prisma.rattachement_utilisateur_etape_jalon.create({
          data: {
            id: "012d942b-3e10-4c75-8956-1e45bce15be9",
            utilisateur_id: utilisateurId,
            rattachement_code: "REG-05",
            etape: $Enums.etape_evaluation_enum.INSTRUCTION,
            jalon: 2025,
          },
        });

      await prisma.referentiel_critere.createMany({
        data: [
          {
            id: "9c60b99a-d716-49dc-b4d5-5a739f241a78",
            libelle: "Critère 1",
            descriptif: "descriptif",
          },
          {
            id: "3ec335a1-0737-4ddf-bdf1-11aa7d7f41fa",
            libelle: "Critère 2",
            descriptif: "descriptif",
          },
        ],
        skipDuplicates: true,
      });

      await prisma.instruction_critere.create({
        data: {
          id: "3dfcf03b-302a-4511-97f4-52170aecdc01",
          rattachement_utilisateur_etape_jalon_id: rattachementInstruction.id,
          critere_id: "9c60b99a-d716-49dc-b4d5-5a739f241a78",
        },
      });
      await prisma.instruction_critere.create({
        data: {
          id: "c8991f0e-1d07-497c-b4b6-d3cf8e2fd016",
          rattachement_utilisateur_etape_jalon_id: rattachementInstruction.id,
          critere_id: "3ec335a1-0737-4ddf-bdf1-11aa7d7f41fa",
        },
      });

      // When
      const resultat = await query.run({
        utilisateurId,
        jalon: 2025,
      });

      // Then
      expect(resultat.instructionManiereDeServir.critereCodes).toEqual(
        expect.arrayContaining([
          "9c60b99a-d716-49dc-b4d5-5a739f241a78",
          "3ec335a1-0737-4ddf-bdf1-11aa7d7f41fa",
        ]),
      );
    });

    it("ne retourne que les droits pour le jalon spécifié", async () => {
      // Given: des rattachements pour différents jalons
      await prisma.rattachement_utilisateur_etape_jalon.create({
        data: {
          id: "b8c9d0e1-f2a3-4b5c-4d5e-7f8a9b0c1d2e",
          utilisateur_id: utilisateurId,
          rattachement_code: "REG-06",
          etape: $Enums.etape_evaluation_enum.AUTO_EVALUATION,
          jalon: 2025,
        },
      });
      await prisma.rattachement_utilisateur_etape_jalon.create({
        data: {
          id: "c9d0e1f2-a3b4-4c5d-5e6f-8a9b0c1d2e3f",
          utilisateur_id: utilisateurId,
          rattachement_code: "REG-07",
          etape: $Enums.etape_evaluation_enum.AUTO_EVALUATION,
          jalon: 2024,
        },
      });

      // When
      const resultat = await query.run({
        utilisateurId,
        jalon: 2025,
      });

      // Then
      expect(resultat.autoEvaluation.rattachementCodes).toEqual(["REG-06"]);
      expect(resultat.autoEvaluation.rattachementCodes).not.toContain("REG-07");
    });

    it("retourne des tableaux vides si l'utilisateur n'a aucun droit", async () => {
      // Given: un utilisateur sans droits

      // When
      const resultat = await query.run({
        utilisateurId,
        jalon: 2025,
      });

      // Then
      expect(resultat).toEqual({
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
      });
    });
  });
});
