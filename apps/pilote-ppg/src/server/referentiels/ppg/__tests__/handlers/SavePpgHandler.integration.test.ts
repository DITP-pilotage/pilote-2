import { PrismaPilote } from "@/server/framework/persistence/PrismaPilote";
import { SavePpgHandler } from "@/server/referentiels/ppg/handlers/SavePpgHandler";
import { createIntegrationTest } from "@/test/createIntegrationTest";
import { fixtures } from "@/test/fixtures";
import { getPrisma } from "@/server/framework/persistence/PrismaTransaction";
import { BadRequestError } from "@/shared/errors/bad-request-error";

describe("SavePpgHandler", () => {
  let handler: SavePpgHandler;
  const prismaPilote = new PrismaPilote();

  beforeEach(() => {
    handler = new SavePpgHandler({ prisma: prismaPilote });
  });

  describe("execute", () => {
    it(
      "crée un nouveau PPG",
      createIntegrationTest(async () => {
        // Given
        const axe = await fixtures.metadataAxe({ axe_id: "AXE-99000" });

        // When
        await handler.execute({
          ppgId: "PPG-99001",
          ppgNom: "Réforme des retraites",
          ppgDesc: null,
          ppgAxe: axe.axe_id,
          isCreation: true,
        });

        // Then
        const ppg = await getPrisma().metadata_ppgs.findUniqueOrThrow({
          where: { ppg_id: "PPG-99001" },
        });
        expect(ppg.ppg_nom).toBe("Réforme des retraites");
        expect(ppg.ppg_axe).toBe(axe.axe_id);
        expect(ppg.deleted_at).toBeNull();
      }),
    );

    it(
      "met à jour un PPG existant",
      createIntegrationTest(async () => {
        // Given
        await fixtures.metadataPpg({
          ppg_id: "PPG-99003",
          ppg_nom: "Ancien nom",
        });

        // When
        await handler.execute({
          ppgId: "PPG-99003",
          ppgNom: "Nouveau nom",
          ppgDesc: "Une desc",
          ppgAxe: null,
          isCreation: false,
        });

        // Then
        const ppg = await getPrisma().metadata_ppgs.findUniqueOrThrow({
          where: { ppg_id: "PPG-99003" },
        });
        expect(ppg.ppg_nom).toBe("Nouveau nom");
        expect(ppg.ppg_desc).toBe("Une desc");
      }),
    );

    it(
      "rejette la création d'un PPG dont l'identifiant existe déjà",
      createIntegrationTest(async () => {
        // Given
        await fixtures.metadataPpg({ ppg_id: "PPG-99004" });

        // When
        const execute = () =>
          handler.execute({
            ppgId: "PPG-99004",
            ppgNom: "Doublon",
            ppgDesc: null,
            ppgAxe: null,
            isCreation: true,
          });

        // Then
        await expect(execute).rejects.toThrow(BadRequestError);
      }),
    );

    it(
      "rejette la création d'un PPG dont l'identifiant existe déjà, même archivé",
      createIntegrationTest(async () => {
        // Given
        await fixtures.metadataPpg({
          ppg_id: "PPG-99005",
          deleted_at: new Date("2026-01-01"),
        });

        // When
        const execute = () =>
          handler.execute({
            ppgId: "PPG-99005",
            ppgNom: "Doublon archivé",
            ppgDesc: null,
            ppgAxe: null,
            isCreation: true,
          });

        // Then
        await expect(execute).rejects.toThrow(BadRequestError);
      }),
    );
  });
});
