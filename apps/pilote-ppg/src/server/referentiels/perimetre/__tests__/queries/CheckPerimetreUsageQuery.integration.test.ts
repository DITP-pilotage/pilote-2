import { PrismaPilote } from "@/server/framework/persistence/PrismaPilote";
import { CheckPerimetreUsageQuery } from "@/server/referentiels/perimetre/queries/CheckPerimetreUsageQuery";
import { createIntegrationTest } from "@/test/createIntegrationTest";
import { fixtures } from "@/test/fixtures";

describe("CheckPerimetreUsageQuery", () => {
  let query: CheckPerimetreUsageQuery;
  const prismaPilote = new PrismaPilote();

  beforeEach(() => {
    query = new CheckPerimetreUsageQuery({ prisma: prismaPilote });
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
