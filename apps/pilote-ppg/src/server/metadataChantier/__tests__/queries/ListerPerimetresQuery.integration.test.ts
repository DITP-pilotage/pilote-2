import { PrismaPilote } from "@/server/db/PrismaPilote";
import { ListerPerimetresQuery } from "@/server/metadataChantier/queries/ListerPerimetresQuery";
import { createIntegrationTest } from "@/server/infrastructure/test/createIntegrationTest";
import { fixtures } from "@/server/infrastructure/test/fixtures";

describe("ListerPerimetresQuery", () => {
  let query: ListerPerimetresQuery;
  const prismaPilote = new PrismaPilote();

  beforeEach(() => {
    query = new ListerPerimetresQuery({ prisma: prismaPilote });
  });

  describe("run", () => {
    it(
      "retourne un tableau vide si aucun périmètre",
      createIntegrationTest(async () => {
        // Given

        // When
        const resultat = await query.run();

        // Then
        expect(resultat).toEqual([]);
      }),
    );

    it(
      "retourne les périmètres triés par perimetre_id",
      createIntegrationTest(async () => {
        // Given
        await fixtures.metadataPerimetre({
          perimetre_id: "PER-C",
          per_nom: "Périmètre C",
        });
        await fixtures.metadataPerimetre({
          perimetre_id: "PER-A",
          per_nom: "Périmètre A",
        });
        await fixtures.metadataPerimetre({
          perimetre_id: "PER-B",
          per_nom: "Périmètre B",
        });

        // When
        const resultat = await query.run();

        // Then
        expect(resultat).toEqual([
          { id: "PER-A", nom: "Périmètre A" },
          { id: "PER-B", nom: "Périmètre B" },
          { id: "PER-C", nom: "Périmètre C" },
        ]);
      }),
    );

    it(
      "exclut les périmètres supprimés",
      createIntegrationTest(async () => {
        // Given
        await fixtures.metadataPerimetre({
          perimetre_id: "PER-010",
          per_nom: "Actif",
        });
        await fixtures.metadataPerimetre({
          perimetre_id: "PER-011",
          per_nom: "Supprimé",
          deleted_at: new Date("2026-01-01"),
        });

        // When
        const resultat = await query.run();

        // Then
        const ids = resultat.map((p) => p.id);
        expect(ids).toContain("PER-010");
        expect(ids).not.toContain("PER-011");
      }),
    );

    it(
      "filtre les périmètres sur le porteur fourni",
      createIntegrationTest(async () => {
        // Given
        await fixtures.metadataPorteur({ porteur_id: "MIN-A" });
        await fixtures.metadataPorteur({ porteur_id: "MIN-B" });
        await fixtures.metadataPerimetre({
          perimetre_id: "PER-A1",
          per_nom: "Périmètre A1",
          per_porteur_id: "MIN-A",
        });
        await fixtures.metadataPerimetre({
          perimetre_id: "PER-B1",
          per_nom: "Périmètre B1",
          per_porteur_id: "MIN-B",
        });

        // When
        const resultat = await query.run({ porteurId: "MIN-A" });

        // Then
        expect(resultat).toEqual([{ id: "PER-A1", nom: "Périmètre A1" }]);
      }),
    );

    it(
      "retourne tous les périmètres si aucun porteur n'est fourni",
      createIntegrationTest(async () => {
        // Given
        await fixtures.metadataPorteur({ porteur_id: "MIN-A" });
        await fixtures.metadataPerimetre({
          perimetre_id: "PER-A1",
          per_nom: "Périmètre A1",
          per_porteur_id: "MIN-A",
        });
        await fixtures.metadataPerimetre({
          perimetre_id: "PER-C1",
          per_nom: "Périmètre sans porteur",
        });

        // When
        const resultat = await query.run();

        // Then
        const ids = resultat.map((p) => p.id);
        expect(ids).toEqual(["PER-A1", "PER-C1"]);
      }),
    );
  });
});
