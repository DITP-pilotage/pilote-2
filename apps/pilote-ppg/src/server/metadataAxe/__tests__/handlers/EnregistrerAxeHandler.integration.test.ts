import { PrismaPilote } from "@/server/db/PrismaPilote";
import { EnregistrerAxeHandler } from "@/server/metadataAxe/handlers/EnregistrerAxeHandler";
import { createIntegrationTest } from "@/server/infrastructure/test/createIntegrationTest";
import { fixtures } from "@/server/infrastructure/test/fixtures";
import { getPrisma } from "@/server/db/PrismaTransaction";
import { BadRequestError } from "@/server/app/error-boundary/bad-request-error";

describe("EnregistrerAxeHandler", () => {
  let handler: EnregistrerAxeHandler;
  const prismaPilote = new PrismaPilote();

  beforeEach(() => {
    handler = new EnregistrerAxeHandler({ prisma: prismaPilote });
  });

  describe("execute", () => {
    it(
      "crée un nouvel axe",
      createIntegrationTest(async () => {
        // When
        await handler.execute({
          axeId: "AXE-99001",
          axeName: "Emploi",
          axeDesc: null,
          estUneCréation: true,
        });

        // Then
        const axe = await getPrisma().metadata_axes.findUniqueOrThrow({
          where: { axe_id: "AXE-99001" },
        });
        expect(axe.axe_name).toBe("Emploi");
        expect(axe.deleted_at).toBeNull();
      }),
    );

    it(
      "met à jour un axe existant",
      createIntegrationTest(async () => {
        // Given
        await fixtures.metadataAxe({
          axe_id: "AXE-99003",
          axe_name: "Ancien nom",
        });

        // When
        await handler.execute({
          axeId: "AXE-99003",
          axeName: "Nouveau nom",
          axeDesc: "Une desc",
          estUneCréation: false,
        });

        // Then
        const axe = await getPrisma().metadata_axes.findUniqueOrThrow({
          where: { axe_id: "AXE-99003" },
        });
        expect(axe.axe_name).toBe("Nouveau nom");
        expect(axe.axe_desc).toBe("Une desc");
      }),
    );

    it(
      "rejette la création d'un axe dont l'identifiant existe déjà",
      createIntegrationTest(async () => {
        // Given
        await fixtures.metadataAxe({ axe_id: "AXE-99004" });

        // When
        const exécuter = () =>
          handler.execute({
            axeId: "AXE-99004",
            axeName: "Doublon",
            axeDesc: null,
            estUneCréation: true,
          });

        // Then
        await expect(exécuter).rejects.toThrow(BadRequestError);
      }),
    );

    it(
      "rejette la création d'un axe dont l'identifiant existe déjà, même archivé",
      createIntegrationTest(async () => {
        // Given
        await fixtures.metadataAxe({
          axe_id: "AXE-99005",
          deleted_at: new Date("2026-01-01"),
        });

        // When
        const exécuter = () =>
          handler.execute({
            axeId: "AXE-99005",
            axeName: "Doublon archivé",
            axeDesc: null,
            estUneCréation: true,
          });

        // Then
        await expect(exécuter).rejects.toThrow(BadRequestError);
      }),
    );
  });
});
