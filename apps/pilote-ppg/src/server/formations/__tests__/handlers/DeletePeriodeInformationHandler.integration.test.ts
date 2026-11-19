import { PrismaPilote } from "@/server/framework/persistence/PrismaPilote";
import { PrismaTransaction } from "@/server/framework/persistence/PrismaTransaction";
import { DeletePeriodeInformationHandler } from "@/server/formations/handlers/DeletePeriodeInformationHandler";
import { createIntegrationTest } from "@/test/createIntegrationTest";
import { fixtures } from "@/test/fixtures";

describe("DeletePeriodeInformationHandler", () => {
  const maintenant = new Date("2026-11-18T10:00:00Z");
  let handler: DeletePeriodeInformationHandler;

  beforeEach(() => {
    handler = new DeletePeriodeInformationHandler({
      prisma: new PrismaPilote(),
      transaction: new PrismaTransaction(),
    });
  });

  it(
    "supprime une période à venir et ses formations",
    createIntegrationTest(async (prisma) => {
      // Given
      const periode = await fixtures.formationPeriodeInformation({
        motifIds: [BigInt(1)],
      });

      // When
      await handler.execute({ id: periode.id, maintenant });

      // Then
      expect(await prisma.formation_periode_information.findMany()).toEqual([]);
      expect(
        await prisma.formation_periode_information_motif.findMany(),
      ).toEqual([]);
    }),
  );

  it(
    "refuse de supprimer une période en cours",
    createIntegrationTest(async () => {
      // Given
      const periode = await fixtures.formationPeriodeInformation({
        date_debut: new Date("2026-11-03T00:00:00Z"),
        date_fin: new Date("2026-11-30T00:00:00Z"),
      });

      // When
      const execution = handler.execute({ id: periode.id, maintenant });

      // Then
      await expect(execution).rejects.toThrow(
        "Seule une période à venir peut être supprimée.",
      );
    }),
  );
});
