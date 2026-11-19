import { PrismaPilote } from "@/server/framework/persistence/PrismaPilote";
import { PrismaTransaction } from "@/server/framework/persistence/PrismaTransaction";
import { SavePeriodeInformationHandler } from "@/server/formations/handlers/SavePeriodeInformationHandler";
import { createIntegrationTest } from "@/test/createIntegrationTest";
import { fixtures } from "@/test/fixtures";

describe("SavePeriodeInformationHandler", () => {
  const maintenant = new Date("2026-11-18T10:00:00Z");
  let handler: SavePeriodeInformationHandler;

  beforeEach(() => {
    handler = new SavePeriodeInformationHandler({
      prisma: new PrismaPilote(),
      transaction: new PrismaTransaction(),
    });
  });

  it(
    "crée une période avec ses formations",
    createIntegrationTest(async (prisma) => {
      // Given
      await fixtures.formationMotif({ id: BigInt(1) });

      // When
      const { id } = await handler.execute({
        commande: {
          id: null,
          dateDebut: "2026-12-01",
          dateFin: "2026-12-31",
          motifIds: [1],
        },
        maintenant,
      });

      // Then
      expect(await prisma.formation_periode_information.findMany()).toEqual([
        {
          id,
          date_debut: new Date("2026-12-01T00:00:00Z"),
          date_fin: new Date("2026-12-31T00:00:00Z"),
        },
      ]);
      expect(
        await prisma.formation_periode_information_motif.findMany(),
      ).toEqual([{ periode_id: id, motif_id: BigInt(1) }]);
    }),
  );

  it(
    "modifie une période en gardant ses dates et remplace ses formations",
    createIntegrationTest(async (prisma) => {
      // Given
      await fixtures.formationMotif({ id: BigInt(1) });
      await fixtures.formationMotif({ id: BigInt(2) });
      const periode = await fixtures.formationPeriodeInformation({
        motifIds: [BigInt(1)],
      });

      // When
      await handler.execute({
        commande: {
          id: periode.id,
          dateDebut: "2026-12-01",
          dateFin: "2026-12-31",
          motifIds: [2],
        },
        maintenant,
      });

      // Then
      expect(
        await prisma.formation_periode_information_motif.findMany(),
      ).toEqual([{ periode_id: periode.id, motif_id: BigInt(2) }]);
    }),
  );

  it(
    "refuse une période qui en chevauche une autre",
    createIntegrationTest(async () => {
      // Given
      await fixtures.formationMotif({ id: BigInt(1) });
      await fixtures.formationPeriodeInformation({
        date_debut: new Date("2026-11-03T00:00:00Z"),
        date_fin: new Date("2026-11-30T00:00:00Z"),
      });

      // When
      const execution = handler.execute({
        commande: {
          id: null,
          dateDebut: "2026-11-30",
          dateFin: "2026-12-15",
          motifIds: [1],
        },
        maintenant,
      });

      // Then
      await expect(execution).rejects.toThrow(
        "Cette période chevauche celle du 03/11/2026 au 30/11/2026.",
      );
    }),
  );

  it(
    "refuse de modifier une période passée",
    createIntegrationTest(async () => {
      // Given
      await fixtures.formationMotif({ id: BigInt(1) });
      const periode = await fixtures.formationPeriodeInformation({
        date_debut: new Date("2026-10-01T00:00:00Z"),
        date_fin: new Date("2026-10-31T00:00:00Z"),
        motifIds: [BigInt(1)],
      });

      // When
      const execution = handler.execute({
        commande: {
          id: periode.id,
          dateDebut: "2026-10-01",
          dateFin: "2026-10-31",
          motifIds: [1],
        },
        maintenant,
      });

      // Then
      await expect(execution).rejects.toThrow(
        "Une période passée ne se modifie plus.",
      );
    }),
  );
});
