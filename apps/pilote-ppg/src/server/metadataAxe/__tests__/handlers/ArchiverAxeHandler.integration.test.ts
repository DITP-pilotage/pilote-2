import { PrismaPilote } from "@/server/db/PrismaPilote";
import { ArchiverAxeHandler } from "@/server/metadataAxe/handlers/ArchiverAxeHandler";
import { VerifierUtilisationAxeQuery } from "@/server/metadataAxe/queries/VerifierUtilisationAxeQuery";
import { createIntegrationTest } from "@/server/infrastructure/test/createIntegrationTest";
import { fixtures } from "@/server/infrastructure/test/fixtures";
import { getPrisma } from "@/server/db/PrismaTransaction";
import { ConflictError } from "@/server/app/error-boundary/conflict-error";

describe("ArchiverAxeHandler", () => {
  let handler: ArchiverAxeHandler;
  const prismaPilote = new PrismaPilote();

  beforeEach(() => {
    handler = new ArchiverAxeHandler({
      prisma: prismaPilote,
      verifierUtilisationAxeQuery: new VerifierUtilisationAxeQuery({
        prisma: prismaPilote,
      }),
    });
  });

  describe("execute", () => {
    it(
      "pose deleted_at sur l'axe",
      createIntegrationTest(async () => {
        // Given
        const axe = await fixtures.metadataAxe({ axe_id: "AXE-99010" });

        // When
        await handler.execute({ axeId: axe.axe_id });

        // Then
        const result = await getPrisma().metadata_axes.findUniqueOrThrow({
          where: { axe_id: "AXE-99010" },
        });
        expect(result.deleted_at).not.toBeNull();
      }),
    );

    it(
      "lève une ConflictError et ne supprime pas l'axe s'il est associé à un PPG",
      createIntegrationTest(async () => {
        // Given
        const axe = await fixtures.metadataAxe({ axe_id: "AXE-99011" });
        await fixtures.metadataPpg({ ppg_axe: axe.axe_id });

        // When
        const exécuter = () => handler.execute({ axeId: axe.axe_id });

        // Then
        await expect(exécuter).rejects.toThrow(ConflictError);
        const result = await getPrisma().metadata_axes.findUniqueOrThrow({
          where: { axe_id: "AXE-99011" },
        });
        expect(result.deleted_at).toBeNull();
      }),
    );
  });
});
