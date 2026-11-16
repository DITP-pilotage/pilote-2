import { PrismaPilote } from "@/server/framework/persistence/PrismaPilote";
import { ListChantiersQuery } from "@/server/parametrage-chantier/queries/ListChantiersQuery";
import { createIntegrationTest } from "@/test/createIntegrationTest";
import { fixtures } from "@/test/fixtures";

describe("ListChantiersQuery", () => {
  let query: ListChantiersQuery;
  const prismaPilote = new PrismaPilote();

  beforeEach(() => {
    query = new ListChantiersQuery({ prisma: prismaPilote });
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
        const chantierLePlusRecent = await fixtures.metadataChantier({
          updated_at: new Date("2026-01-03"),
        });
        const chantierLePlusAncien = await fixtures.metadataChantier({
          updated_at: new Date("2026-01-01"),
        });
        const chantierIntermediaire = await fixtures.metadataChantier({
          updated_at: new Date("2026-01-02"),
        });

        // When
        const resultat = await query.run();

        // Then
        expect(resultat).toEqual([
          expect.objectContaining({
            chantierId: chantierLePlusRecent.chantier_id,
          }),
          expect.objectContaining({
            chantierId: chantierIntermediaire.chantier_id,
          }),
          expect.objectContaining({
            chantierId: chantierLePlusAncien.chantier_id,
          }),
        ]);
      }),
    );

    it(
      "présente les champs du contrat correctement",
      createIntegrationTest(async () => {
        // Given
        const updatedAt = new Date("2026-06-15T10:00:00.000Z");
        const perimetre = await fixtures.metadataPerimetre({
          perimetre_id: "PER-042",
          per_nom: "Périmètre Fonction publique",
        });
        const chantier = await fixtures.metadataChantier({
          ch_nom: "Mon chantier",
          ch_state: "PUBLIE",
          ch_per: perimetre.perimetre_id,
          updated_at: updatedAt,
        });

        // When
        const resultat = await query.run();

        // Then
        expect(resultat).toEqual([
          {
            chantierId: chantier.chantier_id,
            chNom: "Mon chantier",
            chState: "PUBLIE",
            perimetreId: "PER-042",
            perimetreNom: "Périmètre Fonction publique",
            updatedAt,
          },
        ]);
      }),
    );
  });
});
