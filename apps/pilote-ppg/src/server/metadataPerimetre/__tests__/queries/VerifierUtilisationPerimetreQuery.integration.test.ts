import { PrismaPilote } from "@/server/db/PrismaPilote";
import { VerifierUtilisationPerimetreQuery } from "@/server/metadataPerimetre/queries/VerifierUtilisationPerimetreQuery";
import { createIntegrationTest } from "@/server/infrastructure/test/createIntegrationTest";
import { fixtures } from "@/server/infrastructure/test/fixtures";

describe("VerifierUtilisationPerimetreQuery", () => {
  let query: VerifierUtilisationPerimetreQuery;
  const prismaPilote = new PrismaPilote();

  beforeEach(() => {
    query = new VerifierUtilisationPerimetreQuery({ prisma: prismaPilote });
  });

  describe("run", () => {
    it(
      "retourne estUtilise à false quand aucun chantier n'est associé au périmètre",
      createIntegrationTest(async () => {
        // Given
        const perimetre = await fixtures.metadataPerimetre({
          perimetre_id: "PER-091",
        });

        // When
        const resultat = await query.run({
          perimetreId: perimetre.perimetre_id,
        });

        // Then
        expect(resultat).toEqual({ estUtilise: false, nombreChantiers: 0 });
      }),
    );

    it(
      "retourne estUtilise à true avec le nombre de chantiers associés au périmètre",
      createIntegrationTest(async () => {
        // Given
        const perimetre = await fixtures.metadataPerimetre({
          perimetre_id: "PER-092",
        });
        await fixtures.metadataChantier({ ch_per: perimetre.perimetre_id });
        await fixtures.metadataChantier({ ch_per: perimetre.perimetre_id });

        // When
        const resultat = await query.run({
          perimetreId: perimetre.perimetre_id,
        });

        // Then
        expect(resultat).toEqual({ estUtilise: true, nombreChantiers: 2 });
      }),
    );
  });
});
