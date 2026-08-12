import { PrismaPilote } from "@/server/db/PrismaPilote";
import { RecupererChantierQuery } from "@/server/metadataChantier/queries/RecupererChantierQuery";
import { createIntegrationTest } from "@/server/infrastructure/test/createIntegrationTest";
import { fixtures } from "@/server/infrastructure/test/fixtures";

describe("RecupererChantierQuery", () => {
  let query: RecupererChantierQuery;
  const prismaPilote = new PrismaPilote();

  beforeEach(() => {
    query = new RecupererChantierQuery({ prisma: prismaPilote });
  });

  describe("run", () => {
    it(
      "retourne le chantier correspondant",
      createIntegrationTest(async () => {
        // Given
        await fixtures.metadataChantier({
          chantier_id: "CH-007",
          ch_nom: "Chantier cible",
        });
        await fixtures.metadataChantier({
          chantier_id: "CH-008",
          ch_nom: "Autre chantier",
        });

        // When
        const resultat = await query.run({ chantierId: "CH-007" });

        // Then
        expect(resultat).toEqual(
          expect.objectContaining({
            chantierId: "CH-007",
            chNom: "Chantier cible",
          }),
        );
      }),
    );

    it(
      "retourne le porteur principal et les porteurs secondaires",
      createIntegrationTest(async () => {
        // Given
        await fixtures.metadataChantier({
          chantier_id: "CH-007",
          porteur_id_principal: "MIN-01",
          porteur_ids_secondaires: ["MIN-02", "MIN-03"],
        });

        // When
        const resultat = await query.run({ chantierId: "CH-007" });

        // Then
        expect(resultat).toEqual(
          expect.objectContaining({
            porteurIdPrincipal: "MIN-01",
            porteurIdsSecondaires: ["MIN-02", "MIN-03"],
          }),
        );
      }),
    );

    it(
      "lève une erreur si le chantier n'existe pas",
      createIntegrationTest(async () => {
        // Given

        // When / Then
        await expect(query.run({ chantierId: "CH-999" })).rejects.toThrow();
      }),
    );
  });
});
