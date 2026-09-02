import { PrismaPilote } from "@/server/db/PrismaPilote";
import { RecupererPpgQuery } from "@/server/metadataPpg/queries/RecupererPpgQuery";
import { createIntegrationTest } from "@/server/infrastructure/test/createIntegrationTest";
import { fixtures } from "@/server/infrastructure/test/fixtures";

describe("RecupererPpgQuery", () => {
  let query: RecupererPpgQuery;
  const prismaPilote = new PrismaPilote();

  beforeEach(() => {
    query = new RecupererPpgQuery({ prisma: prismaPilote });
  });

  describe("run", () => {
    it(
      "retourne le PPG demandé",
      createIntegrationTest(async () => {
        // Given
        const axe = await fixtures.metadataAxe({ axe_id: "AXE-92010" });
        await fixtures.metadataPpg({
          ppg_id: "PPG-92001",
          ppg_nom: "Réforme des retraites",
          ppg_desc: "Une description",
          ppg_axe: axe.axe_id,
        });

        // When
        const resultat = await query.run({ ppgId: "PPG-92001" });

        // Then
        expect(resultat).toEqual({
          ppgId: "PPG-92001",
          ppgNom: "Réforme des retraites",
          ppgDesc: "Une description",
          ppgAxe: axe.axe_id,
          deletedAt: null,
        });
      }),
    );
  });
});
