import { PrismaPilote } from "@/server/db/PrismaPilote";
import { ArchiverPerimetreHandler } from "@/server/metadataPerimetre/handlers/ArchiverPerimetreHandler";
import { VerifierUtilisationPerimetreQuery } from "@/server/metadataPerimetre/queries/VerifierUtilisationPerimetreQuery";
import { createIntegrationTest } from "@/server/infrastructure/test/createIntegrationTest";
import { fixtures } from "@/server/infrastructure/test/fixtures";
import { getPrisma } from "@/server/db/PrismaTransaction";
import { ConflictError } from "@/server/app/error-boundary/conflict-error";

describe("ArchiverPerimetreHandler", () => {
  let handler: ArchiverPerimetreHandler;
  const prismaPilote = new PrismaPilote();

  beforeEach(() => {
    handler = new ArchiverPerimetreHandler({
      prisma: prismaPilote,
      verifierUtilisationPerimetreQuery: new VerifierUtilisationPerimetreQuery({
        prisma: prismaPilote,
      }),
    });
  });

  describe("execute", () => {
    it(
      "pose deleted_at sur le périmètre",
      createIntegrationTest(async () => {
        // Given
        const perimetre = await fixtures.metadataPerimetre({
          perimetre_id: "PER-090",
        });

        // When
        await handler.execute({ perimetreId: perimetre.perimetre_id });

        // Then
        const result = await getPrisma().metadata_perimetres.findUniqueOrThrow({
          where: { perimetre_id: "PER-090" },
        });
        expect(result.deleted_at).not.toBeNull();
      }),
    );

    it(
      "lève une ConflictError et ne supprime pas le périmètre s'il est associé à un chantier",
      createIntegrationTest(async () => {
        // Given
        const perimetre = await fixtures.metadataPerimetre({
          perimetre_id: "PER-093",
        });
        await fixtures.metadataChantier({ ch_per: perimetre.perimetre_id });

        // When
        const exécuter = () =>
          handler.execute({ perimetreId: perimetre.perimetre_id });

        // Then
        await expect(exécuter).rejects.toThrow(ConflictError);
        const result = await getPrisma().metadata_perimetres.findUniqueOrThrow({
          where: { perimetre_id: "PER-093" },
        });
        expect(result.deleted_at).toBeNull();
      }),
    );
  });
});
