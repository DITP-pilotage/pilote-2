import { PrismaPilote } from "@/server/db/PrismaPilote";
import { VerifierUtilisationAxeQuery } from "@/server/metadataAxe/queries/VerifierUtilisationAxeQuery";
import { createIntegrationTest } from "@/server/infrastructure/test/createIntegrationTest";
import { fixtures } from "@/server/infrastructure/test/fixtures";

describe("VerifierUtilisationAxeQuery", () => {
  let query: VerifierUtilisationAxeQuery;
  const prismaPilote = new PrismaPilote();

  beforeEach(() => {
    query = new VerifierUtilisationAxeQuery({ prisma: prismaPilote });
  });

  describe("run", () => {
    it(
      "retourne estUtilise à false quand aucun PPG n'est associé à l'axe",
      createIntegrationTest(async () => {
        // Given
        const axe = await fixtures.metadataAxe({ axe_id: "AXE-91001" });

        // When
        const resultat = await query.run({ axeId: axe.axe_id });

        // Then
        expect(resultat).toEqual({ estUtilise: false, nombrePpgs: 0 });
      }),
    );

    it(
      "retourne estUtilise à true avec le nombre de PPG associés à l'axe",
      createIntegrationTest(async () => {
        // Given
        const axe = await fixtures.metadataAxe({ axe_id: "AXE-91002" });
        await fixtures.metadataPpg({ ppg_axe: axe.axe_id });

        // When
        const resultat = await query.run({ axeId: axe.axe_id });

        // Then
        expect(resultat).toEqual({ estUtilise: true, nombrePpgs: 1 });
      }),
    );
  });
});
