import { PrismaPilote } from "@/server/framework/persistence/PrismaPilote";
import { CheckPpgUsageQuery } from "@/server/referentiels/ppg/queries/CheckPpgUsageQuery";
import { createIntegrationTest } from "@/test/createIntegrationTest";
import { fixtures } from "@/test/fixtures";

describe("CheckPpgUsageQuery", () => {
  let query: CheckPpgUsageQuery;
  const prismaPilote = new PrismaPilote();

  beforeEach(() => {
    query = new CheckPpgUsageQuery({ prisma: prismaPilote });
  });

  describe("run", () => {
    it(
      "retourne estUtilise à false quand aucun chantier n'est associé au PPG",
      createIntegrationTest(async () => {
        // Given
        const ppg = await fixtures.metadataPpg({ ppg_id: "PPG-91001" });

        // When
        const resultat = await query.run({ ppgId: ppg.ppg_id });

        // Then
        expect(resultat).toEqual({ estUtilise: false, nombreChantiers: 0 });
      }),
    );

    it(
      "retourne estUtilise à true avec le nombre de chantiers associés au PPG",
      createIntegrationTest(async () => {
        // Given
        const ppg = await fixtures.metadataPpg({ ppg_id: "PPG-91002" });
        await fixtures.metadataChantier({ ch_ppg: ppg.ppg_id });

        // When
        const resultat = await query.run({ ppgId: ppg.ppg_id });

        // Then
        expect(resultat).toEqual({ estUtilise: true, nombreChantiers: 1 });
      }),
    );
  });
});
