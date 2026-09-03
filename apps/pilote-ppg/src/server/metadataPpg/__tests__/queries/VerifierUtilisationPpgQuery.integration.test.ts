import { PrismaPilote } from "@/server/db/PrismaPilote";
import { VerifierUtilisationPpgQuery } from "@/server/metadataPpg/queries/VerifierUtilisationPpgQuery";
import { createIntegrationTest } from "@/server/infrastructure/test/createIntegrationTest";
import { fixtures } from "@/server/infrastructure/test/fixtures";

describe("VerifierUtilisationPpgQuery", () => {
  let query: VerifierUtilisationPpgQuery;
  const prismaPilote = new PrismaPilote();

  beforeEach(() => {
    query = new VerifierUtilisationPpgQuery({ prisma: prismaPilote });
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
