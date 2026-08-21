import { PrismaPilote } from "@/server/db/PrismaPilote";
import { RecupererIdSuivantPorteurQuery } from "@/server/metadataPorteur/queries/RecupererIdSuivantPorteurQuery";
import { createIntegrationTest } from "@/server/infrastructure/test/createIntegrationTest";
import { fixtures } from "@/server/infrastructure/test/fixtures";

describe("RecupererIdSuivantPorteurQuery", () => {
  let query: RecupererIdSuivantPorteurQuery;
  const prismaPilote = new PrismaPilote();

  beforeEach(() => {
    query = new RecupererIdSuivantPorteurQuery({ prisma: prismaPilote });
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
