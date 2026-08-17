import { PrismaPilote } from "@/server/db/PrismaPilote";
import { SupprimerPorteurHandler } from "@/server/metadataPorteur/handlers/SupprimerPorteurHandler";
import { createIntegrationTest } from "@/server/infrastructure/test/createIntegrationTest";
import { fixtures } from "@/server/infrastructure/test/fixtures";
import { getPrisma } from "@/server/db/PrismaTransaction";

describe("SupprimerPorteurHandler", () => {
  let handler: SupprimerPorteurHandler;
  const prismaPilote = new PrismaPilote();

  beforeEach(() => {
    handler = new SupprimerPorteurHandler({ prisma: prismaPilote });
  });

  describe("execute", () => {
    it(
      "pose deleted_at sur le porteur",
      createIntegrationTest(async () => {
        // Given
        const porteur = await fixtures.metadataPorteur({ porteur_id: "99010" });

        // When
        await handler.execute({ porteurId: porteur.porteur_id });

        // Then
        const result = await getPrisma().metadata_porteurs.findUniqueOrThrow({
          where: { porteur_id: "99010" },
        });
        expect(result.deleted_at).not.toBeNull();
      }),
    );

    it(
      "restaure un porteur supprimé",
      createIntegrationTest(async () => {
        // Given
        const porteur = await fixtures.metadataPorteur({
          porteur_id: "99011",
          deleted_at: new Date("2026-01-01"),
        });

        // When
        await handler.execute({ porteurId: porteur.porteur_id, restaurer: true });

        // Then
        const result = await getPrisma().metadata_porteurs.findUniqueOrThrow({
          where: { porteur_id: "99011" },
        });
        expect(result.deleted_at).toBeNull();
      }),
    );
  });
});
