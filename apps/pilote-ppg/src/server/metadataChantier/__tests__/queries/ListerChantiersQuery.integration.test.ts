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
      "retourne les chantiers triés par date de mise à jour décroissante",
      createIntegrationTest(async () => {
        // Given — updated_at explicites pour garantir l'ordre indépendamment de la vitesse d'insertion
        await fixtures.metadataChantier({
          chantier_id: "CH-003",
          updated_at: new Date("2026-01-03"),
        });
        await fixtures.metadataChantier({
          chantier_id: "CH-001",
          updated_at: new Date("2026-01-01"),
        });
        await fixtures.metadataChantier({
          chantier_id: "CH-002",
          updated_at: new Date("2026-01-02"),
        });

        // When
        const resultat = await query.run();

        // Then
        expect(resultat).toEqual([
          expect.objectContaining({ chantierId: "CH-003" }),
          expect.objectContaining({ chantierId: "CH-002" }),
          expect.objectContaining({ chantierId: "CH-001" }),
        ]);
      }),
    );

    it(
      "présente les champs du contrat correctement",
      createIntegrationTest(async () => {
        // Given
        const updatedAt = new Date("2026-06-15T10:00:00.000Z");
        await fixtures.metadataChantier({
          chantier_id: "CH-042",
          ch_nom: "Mon chantier",
          ch_state: "PUBLIE",
          updated_at: updatedAt,
        });

        // When
        const resultat = await query.run();

        // Then
        expect(resultat).toEqual([
          {
            chantierId: "CH-042",
            chNom: "Mon chantier",
            chState: "PUBLIE",
            updatedAt,
          },
        ]);
      }),
    );
  });
});
