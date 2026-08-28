import { PrismaPilote } from "@/server/db/PrismaPilote";
import { ArchiverPorteurHandler } from "@/server/metadataPorteur/handlers/ArchiverPorteurHandler";
import { VerifierUtilisationPorteurQuery } from "@/server/metadataPorteur/queries/VerifierUtilisationPorteurQuery";
import { createIntegrationTest } from "@/server/infrastructure/test/createIntegrationTest";
import { fixtures } from "@/server/infrastructure/test/fixtures";
import { getPrisma } from "@/server/db/PrismaTransaction";
import { ConflictError } from "@/server/app/error-boundary/conflict-error";

describe("ArchiverPorteurHandler", () => {
  let handler: ArchiverPorteurHandler;
  const prismaPilote = new PrismaPilote();

  beforeEach(() => {
    handler = new ArchiverPorteurHandler({
      prisma: prismaPilote,
      verifierUtilisationPorteurQuery: new VerifierUtilisationPorteurQuery({
        prisma: prismaPilote,
      }),
    });
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
      "lève une ConflictError et ne supprime pas le porteur s'il est associé à un périmètre",
      createIntegrationTest(async () => {
        // Given
        const porteur = await fixtures.metadataPorteur({ porteur_id: "99011" });
        await fixtures.metadataPerimetre({
          per_porteur_id: porteur.porteur_id,
        });

        // When
        const exécuter = () =>
          handler.execute({ porteurId: porteur.porteur_id });

        // Then
        await expect(exécuter).rejects.toThrow(ConflictError);
        const result = await getPrisma().metadata_porteurs.findUniqueOrThrow({
          where: { porteur_id: "99011" },
        });
        expect(result.deleted_at).toBeNull();
      }),
    );

    it(
      "lève une ConflictError et ne supprime pas le porteur s'il est associé à un chantier",
      createIntegrationTest(async () => {
        // Given
        const porteur = await fixtures.metadataPorteur({ porteur_id: "99012" });
        await fixtures.metadataChantier({
          porteur_id_principal: porteur.porteur_id,
        });

        // When
        const exécuter = () =>
          handler.execute({ porteurId: porteur.porteur_id });

        // Then
        await expect(exécuter).rejects.toThrow(ConflictError);
        const result = await getPrisma().metadata_porteurs.findUniqueOrThrow({
          where: { porteur_id: "99012" },
        });
        expect(result.deleted_at).toBeNull();
      }),
    );
  });
});
