import { PrismaPilote } from "@/server/framework/persistence/PrismaPilote";
import { RestorePorteurHandler } from "@/server/referentiels/porteur/handlers/RestorePorteurHandler";
import { createIntegrationTest } from "@/test/createIntegrationTest";
import { fixtures } from "@/test/fixtures";
import { getPrisma } from "@/server/framework/persistence/PrismaTransaction";

describe("RestorePorteurHandler", () => {
  let handler: RestorePorteurHandler;
  const prismaPilote = new PrismaPilote();

  beforeEach(() => {
    handler = new RestorePorteurHandler({ prisma: prismaPilote });
  });

  describe("execute", () => {
    it(
      "restaure un porteur supprimé",
      createIntegrationTest(async () => {
        // Given
        const porteur = await fixtures.metadataPorteur({
          porteur_id: "99011",
          deleted_at: new Date("2026-01-01"),
        });

        // When
        await handler.execute({ porteurId: porteur.porteur_id });

        // Then
        const result = await getPrisma().metadata_porteurs.findUniqueOrThrow({
          where: { porteur_id: "99011" },
        });
        expect(result.deleted_at).toBeNull();
      }),
    );
  });
});
