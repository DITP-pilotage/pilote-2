import { PrismaPilote } from "@/server/framework/persistence/PrismaPilote";
import { SetMotifProfilHandler } from "@/server/formations/handlers/SetMotifProfilHandler";
import { createIntegrationTest } from "@/test/createIntegrationTest";
import { fixtures } from "@/test/fixtures";

describe("SetMotifProfilHandler", () => {
  let handler: SetMotifProfilHandler;

  beforeEach(() => {
    handler = new SetMotifProfilHandler({ prisma: new PrismaPilote() });
  });

  it(
    "propose une formation à un profil, sans doublon si on coche deux fois",
    createIntegrationTest(async (prisma) => {
      // Given
      await fixtures.formationMotif({ id: BigInt(1) });

      // When
      const commande = { motifId: 1, profilCode: "DITP_ADMIN", propose: true };
      await handler.execute(commande);
      await handler.execute(commande);

      // Then
      expect(
        await prisma.formation_motif_profil.findMany({
          select: { motif_id: true, profil_code: true },
        }),
      ).toEqual([{ motif_id: BigInt(1), profil_code: "DITP_ADMIN" }]);
    }),
  );

  it(
    "retire une formation d'un profil, sans erreur si elle n'était plus proposée",
    createIntegrationTest(async (prisma) => {
      // Given
      await fixtures.formationMotif({ id: BigInt(1) });
      await prisma.formation_motif_profil.create({
        data: { motif_id: BigInt(1), profil_code: "DITP_ADMIN" },
      });

      // When
      const commande = { motifId: 1, profilCode: "DITP_ADMIN", propose: false };
      await handler.execute(commande);
      await handler.execute(commande);

      // Then
      expect(await prisma.formation_motif_profil.findMany()).toEqual([]);
    }),
  );

  it(
    "refuse une formation supprimée dans RDV-SP",
    createIntegrationTest(async () => {
      // Given
      await fixtures.formationMotif({
        id: BigInt(1),
        date_suppression: new Date("2026-11-01T00:00:00Z"),
      });

      // When
      const execution = handler.execute({
        motifId: 1,
        profilCode: "DITP_ADMIN",
        propose: true,
      });

      // Then
      await expect(execution).rejects.toThrow(
        "Cette formation n'existe pas ou a été supprimée dans RDV-SP.",
      );
    }),
  );
});
