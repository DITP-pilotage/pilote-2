import { PrismaPilote } from "@/server/db/PrismaPilote";
import { ListerChantiersQuery } from "@/server/metadataChantier/queries/ListerChantiersQuery";
import { createIntegrationTest } from "@/server/infrastructure/test/createIntegrationTest";
import { fixtures } from "@/server/infrastructure/test/fixtures";

describe("ListerChantiersQuery", () => {
  let query: ListerChantiersQuery;
  const prismaPilote = new PrismaPilote();

  beforeEach(() => {
    query = new ListerChantiersQuery({ prisma: prismaPilote });
  });

  describe("run", () => {
    it(
      "retourne un tableau vide si aucun chantier",
      createIntegrationTest(async () => {
        // Given

        // When
        const resultat = await query.run();

        // Then
        expect(resultat).toEqual([]);
      }),
    );

    it(
      "retourne les chantiers triés par chantier_id",
      createIntegrationTest(async () => {
        // Given
        await fixtures.metadataChantier({ chantier_id: "CH-003" });
        await fixtures.metadataChantier({ chantier_id: "CH-001" });
        await fixtures.metadataChantier({ chantier_id: "CH-002" });

        // When
        const resultat = await query.run();

        // Then
        expect(resultat).toEqual([
          expect.objectContaining({ chantierId: "CH-001" }),
          expect.objectContaining({ chantierId: "CH-002" }),
          expect.objectContaining({ chantierId: "CH-003" }),
        ]);
      }),
    );

    it(
      "présente les champs du contrat correctement",
      createIntegrationTest(async () => {
        // Given
        await fixtures.metadataChantier({
          chantier_id: "CH-042",
          ch_nom: "Mon chantier",
          ch_state: "PUBLIE",
        });

        // When
        const resultat = await query.run();

        // Then
        expect(resultat).toEqual([
          {
            chantierId: "CH-042",
            chNom: "Mon chantier",
            chState: "PUBLIE",
          },
        ]);
      }),
    );
  });
});
