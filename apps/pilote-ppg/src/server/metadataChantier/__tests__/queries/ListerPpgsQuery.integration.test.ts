import { PrismaPilote } from "@/server/db/PrismaPilote";
import { ListerPpgsQuery } from "@/server/metadataChantier/queries/ListerPpgsQuery";
import { createIntegrationTest } from "@/server/infrastructure/test/createIntegrationTest";
import { fixtures } from "@/server/infrastructure/test/fixtures";

describe("ListerPpgsQuery", () => {
  let query: ListerPpgsQuery;
  const prismaPilote = new PrismaPilote();

  beforeEach(() => {
    query = new ListerPpgsQuery({ prisma: prismaPilote });
  });

  describe("run", () => {
    it(
      "retourne un tableau vide si aucun ppg",
      createIntegrationTest(async () => {
        // Given

        // When
        const resultat = await query.run();

        // Then
        expect(resultat).toEqual([]);
      }),
    );

    it(
      "retourne les ppgs triés par ppg_id",
      createIntegrationTest(async () => {
        // Given
        await fixtures.metadataPpg({ ppg_id: "PPG-003", ppg_nom: "C" });
        await fixtures.metadataPpg({ ppg_id: "PPG-001", ppg_nom: "A" });
        await fixtures.metadataPpg({ ppg_id: "PPG-002", ppg_nom: "B" });

        // When
        const resultat = await query.run();

        // Then
        expect(resultat).toEqual([
          { id: "PPG-001", nom: "A" },
          { id: "PPG-002", nom: "B" },
          { id: "PPG-003", nom: "C" },
        ]);
      }),
    );
  });
});
