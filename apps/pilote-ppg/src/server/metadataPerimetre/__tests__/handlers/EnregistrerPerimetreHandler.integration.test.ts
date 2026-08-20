import { PrismaPilote } from "@/server/db/PrismaPilote";
import { EnregistrerPerimetreHandler } from "@/server/metadataPerimetre/handlers/EnregistrerPerimetreHandler";
import { createIntegrationTest } from "@/server/infrastructure/test/createIntegrationTest";
import { fixtures } from "@/server/infrastructure/test/fixtures";
import { getPrisma } from "@/server/db/PrismaTransaction";

describe("EnregistrerPerimetreHandler", () => {
  let handler: EnregistrerPerimetreHandler;
  const prismaPilote = new PrismaPilote();

  beforeEach(() => {
    handler = new EnregistrerPerimetreHandler({ prisma: prismaPilote });
  });

  describe("execute", () => {
    it(
      "crée un nouveau périmètre sans porteur",
      createIntegrationTest(async () => {
        // When
        await handler.execute({
          perimetreId: "PER-099",
          perimetreNom: "Périmètre de test",
          perimetrePorteurId: null,
        });

        // Then
        const perimetre =
          await getPrisma().metadata_perimetres.findUniqueOrThrow({
            where: { perimetre_id: "PER-099" },
          });
        expect(perimetre.per_nom).toBe("Périmètre de test");
        expect(perimetre.per_porteur_id).toBeNull();
        expect(perimetre.deleted_at).toBeNull();
      }),
    );

    it(
      "crée un périmètre avec porteur associé",
      createIntegrationTest(async () => {
        // Given
        const porteur = await fixtures.metadataPorteur({ porteur_id: "88001" });

        // When
        await handler.execute({
          perimetreId: "PER-098",
          perimetreNom: "Périmètre avec porteur",
          perimetrePorteurId: porteur.porteur_id,
        });

        // Then
        const perimetre =
          await getPrisma().metadata_perimetres.findUniqueOrThrow({
            where: { perimetre_id: "PER-098" },
          });
        expect(perimetre.per_porteur_id).toBe("88001");
      }),
    );

    it(
      "met à jour un périmètre existant",
      createIntegrationTest(async () => {
        // Given
        await fixtures.metadataPerimetre({
          perimetre_id: "PER-097",
          per_nom: "Ancien nom",
        });

        // When
        await handler.execute({
          perimetreId: "PER-097",
          perimetreNom: "Nouveau nom",
          perimetrePorteurId: null,
        });

        // Then
        const perimetre =
          await getPrisma().metadata_perimetres.findUniqueOrThrow({
            where: { perimetre_id: "PER-097" },
          });
        expect(perimetre.per_nom).toBe("Nouveau nom");
      }),
    );
  });
});
