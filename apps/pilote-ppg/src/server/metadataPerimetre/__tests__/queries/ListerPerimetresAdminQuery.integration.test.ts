import { PrismaPilote } from "@/server/db/PrismaPilote";
import { ListerPerimetresAdminQuery } from "@/server/metadataPerimetre/queries/ListerPerimetresAdminQuery";
import { createIntegrationTest } from "@/server/infrastructure/test/createIntegrationTest";
import { fixtures } from "@/server/infrastructure/test/fixtures";

describe("ListerPerimetresAdminQuery", () => {
  let query: ListerPerimetresAdminQuery;
  const prismaPilote = new PrismaPilote();

  beforeEach(() => {
    query = new ListerPerimetresAdminQuery({ prisma: prismaPilote });
  });

  describe("run", () => {
    it(
      "retourne tous les périmètres y compris les supprimés avec porteur_short résolu",
      createIntegrationTest(async () => {
        // Given
        const porteur = await fixtures.metadataPorteur({ porteur_id: "77001", porteur_short: "MIN" });
        await fixtures.metadataPerimetre({ perimetre_id: "PER-080", per_nom: "Actif", per_porteur_id: porteur.porteur_id });
        await fixtures.metadataPerimetre({
          perimetre_id: "PER-081",
          per_nom: "Supprimé",
          deleted_at: new Date("2026-01-01"),
        });

        // When
        const resultat = await query.run();

        // Then
        const ids = resultat.map((p) => p.perimetreId);
        expect(ids).toContain("PER-080");
        expect(ids).toContain("PER-081");
        const actif = resultat.find((p) => p.perimetreId === "PER-080");
        expect(actif?.porteurShort).toBe("MIN");
        const supprime = resultat.find((p) => p.perimetreId === "PER-081");
        expect(supprime?.deletedAt).not.toBeNull();
      }),
    );
  });
});
