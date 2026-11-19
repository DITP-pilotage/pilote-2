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
    "supprime une période à venir en gardant la ligne et ses formations",
    createIntegrationTest(async (prisma) => {
      // Given
      const periode = await fixtures.formationPeriodeInformation({
        motifIds: [BigInt(1)],
      });

      // When
      await handler.execute({ id: periode.id, maintenant });

      // Then
      expect(
        await prisma.formation_periode_information.findMany({
          select: { id: true, deleted_at: true },
        }),
      ).toEqual([{ id: periode.id, deleted_at: maintenant }]);
      expect(
        await prisma.formation_periode_information_motif.findMany({
          select: { periode_id: true, motif_id: true },
        }),
      ).toEqual([{ periode_id: periode.id, motif_id: BigInt(1) }]);
    }),
  );

  it(
    "supprime une période en cours",
    createIntegrationTest(async (prisma) => {
      // Given
      const periode = await fixtures.formationPeriodeInformation({
        date_debut: new Date("2026-11-03T00:00:00Z"),
        date_fin: new Date("2026-11-30T00:00:00Z"),
      });

      // When
      await handler.execute({ id: periode.id, maintenant });

      // Then
      expect(
        await prisma.formation_periode_information.findMany({
          select: { id: true, deleted_at: true },
        }),
      ).toEqual([{ id: periode.id, deleted_at: maintenant }]);
    }),
  );

  it(
    "refuse de supprimer une période passée",
    createIntegrationTest(async () => {
      // Given
      const periode = await fixtures.formationPeriodeInformation({
        date_debut: new Date("2026-10-01T00:00:00Z"),
        date_fin: new Date("2026-10-31T00:00:00Z"),
      });

      // When
      const execution = handler.execute({ id: periode.id, maintenant });

      // Then
      await expect(execution).rejects.toThrow(
        "Une période passée ne se supprime pas.",
      );
    }),
  );

  it(
    "refuse de supprimer une période déjà supprimée",
    createIntegrationTest(async () => {
      // Given
      const periode = await fixtures.formationPeriodeInformation({
        deleted_at: new Date("2026-11-10T08:00:00Z"),
      });

      // When
      const execution = handler.execute({ id: periode.id, maintenant });

      // Then
      await expect(execution).rejects.toThrow(
        "Cette période est déjà supprimée.",
      );
    }),
  );
});
