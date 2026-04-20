import { $Enums } from "@prisma/client";
import { ModifierDroitsUtilisateurHandler } from "@/server/evaluation/handlers/ModifierDroitsUtilisateurHandler";
import { PrismaPilote } from "@/server/db/PrismaPilote";
import { InMemoryTransaction } from "@/server/db/InMemoryTransaction";
import { createIntegrationTest } from "@/server/infrastructure/test/createIntegrationTest";
import { fixtures } from "@/server/infrastructure/test/fixtures";

describe("ModifierDroitsUtilisateurHandler", () => {
  let handler: ModifierDroitsUtilisateurHandler;
  const prismaPilote = new PrismaPilote();
  const transaction = new InMemoryTransaction();

  beforeEach(() => {
    handler = new ModifierDroitsUtilisateurHandler({
      transaction,
      prisma: prismaPilote,
    });
  });

  describe("execute", () => {
    it(
      "crée les rattachements pour l'auto-évaluation",
      createIntegrationTest(async (tx) => {
        // Given
        const utilisateur = await fixtures.utilisateur();
        const rattachement1 = await fixtures.rattachement({ code: "REG-01" });
        const rattachement2 = await fixtures.rattachement({ code: "REG-02" });

        const command = {
          utilisateurId: utilisateur.id,
          jalon: 2025,
          autoEvaluation: {
            rattachementCodes: [rattachement1.code, rattachement2.code],
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
          await tx.rattachement_utilisateur_etape_jalon.findMany({
            where: {
              utilisateur_id: utilisateur.id,
              jalon: 2025,
              etape: $Enums.etape_evaluation_enum.AUTO_EVALUATION,
            },
          });

        expect(rattachements).toHaveLength(2);
        expect(rattachements.map((r) => r.rattachement_code)).toEqual(
          expect.arrayContaining([rattachement1.code, rattachement2.code]),
        );
      }),
    );

    it(
      "crée les rattachements pour la consolidation",
      createIntegrationTest(async (tx) => {
        // Given
        const utilisateur = await fixtures.utilisateur();
        const rattachement = await fixtures.rattachement({ code: "REG-03" });

        const command = {
          utilisateurId: utilisateur.id,
          jalon: 2025,
          autoEvaluation: {
            rattachementCodes: [],
          },
          consolidation: {
            rattachementCodes: [rattachement.code],
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
          await tx.rattachement_utilisateur_etape_jalon.findMany({
            where: {
              utilisateur_id: utilisateur.id,
              jalon: 2025,
              etape: $Enums.etape_evaluation_enum.CONSOLIDATION,
            },
          });

        expect(rattachements).toHaveLength(1);
        expect(rattachements[0].rattachement_code).toBe(rattachement.code);
      }),
    );

    it(
      "supprime les anciens rattachements et crée les nouveaux",
      createIntegrationTest(async (tx) => {
        // Given
        const utilisateur = await fixtures.utilisateur();
        const rattachement1 = await fixtures.rattachement({ code: "REG-01" });
        const rattachement2 = await fixtures.rattachement({ code: "REG-02" });
        const rattachement3 = await fixtures.rattachement({ code: "REG-03" });

        await fixtures.rattachementUtilisateurEtapeJalon({
          utilisateur_id: utilisateur.id,
          rattachement_code: rattachement1.code,
          etape: $Enums.etape_evaluation_enum.AUTO_EVALUATION,
        });

        const command = {
          utilisateurId: utilisateur.id,
          jalon: 2025,
          autoEvaluation: {
            rattachementCodes: [rattachement2.code, rattachement3.code],
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
          await tx.rattachement_utilisateur_etape_jalon.findMany({
            where: {
              utilisateur_id: utilisateur.id,
              jalon: 2025,
              etape: $Enums.etape_evaluation_enum.AUTO_EVALUATION,
            },
          });

        expect(rattachements).toHaveLength(2);
        expect(rattachements.map((r) => r.rattachement_code)).toEqual(
          expect.arrayContaining([rattachement2.code, rattachement3.code]),
        );
        expect(rattachements.map((r) => r.rattachement_code)).not.toContain(
          rattachement1.code,
        );
      }),
    );

    it(
      "ne supprime que les rattachements du jalon spécifié",
      createIntegrationTest(async (tx) => {
        // Given
        const utilisateur = await fixtures.utilisateur();
        const rattachement1 = await fixtures.rattachement({ code: "REG-01" });
        const rattachement2 = await fixtures.rattachement({ code: "REG-02" });
        const rattachement3 = await fixtures.rattachement({ code: "REG-03" });

        await fixtures.rattachementUtilisateurEtapeJalon({
          utilisateur_id: utilisateur.id,
          rattachement_code: rattachement1.code,
          etape: $Enums.etape_evaluation_enum.AUTO_EVALUATION,
          jalon: 2025,
        });
        await fixtures.rattachementUtilisateurEtapeJalon({
          utilisateur_id: utilisateur.id,
          rattachement_code: rattachement2.code,
          etape: $Enums.etape_evaluation_enum.AUTO_EVALUATION,
          jalon: 2024,
        });

        const command = {
          utilisateurId: utilisateur.id,
          jalon: 2025,
          autoEvaluation: {
            rattachementCodes: [rattachement3.code],
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
          await tx.rattachement_utilisateur_etape_jalon.findFirst({
            where: {
              utilisateur_id: utilisateur.id,
              jalon: 2024,
            },
          });

        expect(rattachement2024).not.toBeNull();
        expect(rattachement2024?.rattachement_code).toBe(rattachement2.code);
      }),
    );

    it(
      "Supprime tous les droits en passant des tableaux vides",
      createIntegrationTest(async (tx) => {
        // Given
        const utilisateur = await fixtures.utilisateur();
        const rattachement = await fixtures.rattachement({ code: "REG-01" });

        await fixtures.rattachementUtilisateurEtapeJalon({
          utilisateur_id: utilisateur.id,
          rattachement_code: rattachement.code,
          etape: $Enums.etape_evaluation_enum.AUTO_EVALUATION,
        });
        await fixtures.rattachementUtilisateurEtapeJalon({
          utilisateur_id: utilisateur.id,
          rattachement_code: rattachement.code,
          etape: $Enums.etape_evaluation_enum.CONSOLIDATION,
        });

        const command = {
          utilisateurId: utilisateur.id,
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
          await tx.rattachement_utilisateur_etape_jalon.findMany({
            where: {
              utilisateur_id: utilisateur.id,
              jalon: 2025,
            },
          });

        expect(rattachements).toHaveLength(0);
      }),
    );

    it(
      "Donne accès à tous les rattachements en instruction et aux critères donnés lorsque des critères sont fournis",
      createIntegrationTest(async (tx) => {
        // Given
        const utilisateur = await fixtures.utilisateur();
        const rattachement1 = await fixtures.rattachement({ code: "REG-01" });
        const rattachement2 = await fixtures.rattachement({ code: "REG-02" });
        const rattachement3 = await fixtures.rattachement({ code: "REG-03" });
        const critere1 = await fixtures.critere();
        const critere2 = await fixtures.critere();

        const command = {
          utilisateurId: utilisateur.id,
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
            critereCodes: [critere1.id, critere2.id],
          },
        };

        // When
        await handler.execute(command);

        // Then
        const rattachementsEtapes =
          await tx.rattachement_utilisateur_etape_jalon.findMany({
            where: {
              utilisateur_id: utilisateur.id,
              jalon: 2025,
              etape: $Enums.etape_evaluation_enum.INSTRUCTION,
            },
          });

        const criteresInstruction = await tx.instruction_critere.findMany({
          where: {
            rattachement_utilisateur_etape_jalon: {
              utilisateur_id: utilisateur.id,
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
        ).toEqual(
          expect.arrayContaining([
            rattachement1.code,
            rattachement2.code,
            rattachement3.code,
          ]),
        );

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
          ).toEqual(expect.arrayContaining([critere1.id, critere2.id]));
        }
      }),
    );

    it(
      "cree uniquement les rattachements selectionnes en instruction quand seuls des objectifs sont choisis et donne accès aux objectifs associés aux rattachements",
      createIntegrationTest(async (tx) => {
        // Given
        const utilisateur = await fixtures.utilisateur();
        const rattachement1 = await fixtures.rattachement({ code: "REG-01" });
        const rattachement2 = await fixtures.rattachement({ code: "REG-02" });
        const rattachement3 = await fixtures.rattachement({ code: "REG-03" });

        const objectif1 = await fixtures.objectif({
          rattachement_code: rattachement1.code,
        });
        const objectif2 = await fixtures.objectif({
          rattachement_code: rattachement1.code,
        });
        const objectif3 = await fixtures.objectif({
          rattachement_code: rattachement2.code,
        });
        await fixtures.objectif({
          rattachement_code: rattachement3.code,
        });

        const command = {
          utilisateurId: utilisateur.id,
          jalon: 2025,
          autoEvaluation: {
            rattachementCodes: [],
          },
          consolidation: {
            rattachementCodes: [],
          },
          instructionObjectifs: {
            rattachementCodes: [rattachement1.code, rattachement2.code],
          },
          instructionManiereDeServir: {
            critereCodes: [],
          },
        };

        // When
        await handler.execute(command);

        // Then
        const rattachementsEtapes =
          await tx.rattachement_utilisateur_etape_jalon.findMany({
            where: {
              utilisateur_id: utilisateur.id,
              jalon: 2025,
              etape: $Enums.etape_evaluation_enum.INSTRUCTION,
            },
          });

        const objectifsInstruction = await tx.instruction_objectif.findMany({});

        expect(rattachementsEtapes).toHaveLength(2);
        expect(
          rattachementsEtapes.map(
            (rattachementEtape) => rattachementEtape.rattachement_code,
          ),
        ).toEqual(
          expect.arrayContaining([rattachement1.code, rattachement2.code]),
        );

        const rattachementEtapeReg01 = rattachementsEtapes.find(
          (rattachementEtape) =>
            rattachementEtape.rattachement_code === rattachement1.code,
        );
        const rattachementEtapeReg02 = rattachementsEtapes.find(
          (rattachementEtape) =>
            rattachementEtape.rattachement_code === rattachement2.code,
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
        ).toEqual(expect.arrayContaining([objectif1.id, objectif2.id]));
        expect(objectifsInstructionReg02).toHaveLength(1);
        expect(
          objectifsInstructionReg02.map((objectif) => objectif.objectif_id),
        ).toEqual(expect.arrayContaining([objectif3.id]));
      }),
    );

    it(
      "gere le cas où des objectifs et des criteres sont selectionnes",
      createIntegrationTest(async (tx) => {
        // Given
        const utilisateur = await fixtures.utilisateur();
        const rattachement1 = await fixtures.rattachement({ code: "REG-01" });
        const rattachement2 = await fixtures.rattachement({ code: "REG-02" });
        const rattachement3 = await fixtures.rattachement({ code: "REG-03" });

        await fixtures.objectif({ rattachement_code: rattachement1.code });
        await fixtures.objectif({ rattachement_code: rattachement1.code });

        const critere = await fixtures.critere();

        const command = {
          utilisateurId: utilisateur.id,
          jalon: 2025,
          autoEvaluation: {
            rattachementCodes: [],
          },
          consolidation: {
            rattachementCodes: [],
          },
          instructionObjectifs: {
            rattachementCodes: [rattachement1.code],
          },
          instructionManiereDeServir: {
            critereCodes: [critere.id],
          },
        };

        // When
        await handler.execute(command);

        // Then
        const rattachements =
          await tx.rattachement_utilisateur_etape_jalon.findMany({
            where: {
              utilisateur_id: utilisateur.id,
              jalon: 2025,
              etape: $Enums.etape_evaluation_enum.INSTRUCTION,
            },
          });
        const instructionCriteres = await tx.instruction_critere.findMany({});
        const instructionObjectifs = await tx.instruction_objectif.findMany({});

        expect(rattachements).toHaveLength(3);
        expect(rattachements.map((r) => r.rattachement_code)).toEqual(
          expect.arrayContaining([
            rattachement1.code,
            rattachement2.code,
            rattachement3.code,
          ]),
        );
        expect(instructionCriteres).toHaveLength(3);
        expect(instructionObjectifs).toHaveLength(2);
      }),
    );
  });
});
