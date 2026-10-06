import { PrismaPilote } from "@/server/framework/persistence/PrismaPilote";
import { GetNextPorteurIdQuery } from "@/server/referentiels/porteur/queries/GetNextPorteurIdQuery";
import { createIntegrationTest } from "@/test/createIntegrationTest";
import { fixtures } from "@/test/fixtures";

describe("GetNextPorteurIdQuery", () => {
  let query: GetNextPorteurIdQuery;
  const prismaPilote = new PrismaPilote();

  beforeEach(() => {
    query = new GetNextPorteurIdQuery({ prisma: prismaPilote });
  });

  describe("run", () => {
    it(
      "retourne 1 si aucun porteur",
      createIntegrationTest(async () => {
        // When
        const resultat = await query.run();

        // Then
        expect(resultat).toBe("1");
      }),
    );

    it(
      "retourne max(id numérique) + 1",
      createIntegrationTest(async () => {
        // Given — ID 500 est le plus grand entier
        await fixtures.metadataPorteur({ porteur_id: "200" });
        await fixtures.metadataPorteur({ porteur_id: "500" });

        // When
        const resultat = await query.run();

        // Then
        expect(resultat).toBe("501");
      }),
    );
  });
});
