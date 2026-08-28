import { PrismaPilote } from "@/server/db/PrismaPilote";
import { VerifierUtilisationPorteurQuery } from "@/server/metadataPorteur/queries/VerifierUtilisationPorteurQuery";
import { createIntegrationTest } from "@/server/infrastructure/test/createIntegrationTest";
import { fixtures } from "@/server/infrastructure/test/fixtures";

describe("VerifierUtilisationPorteurQuery", () => {
  let query: VerifierUtilisationPorteurQuery;
  const prismaPilote = new PrismaPilote();

  beforeEach(() => {
    query = new VerifierUtilisationPorteurQuery({ prisma: prismaPilote });
  });

  describe("run", () => {
    it(
      "retourne estUtilise à false quand aucun périmètre ni chantier n'est associé au porteur",
      createIntegrationTest(async () => {
        // Given
        const porteur = await fixtures.metadataPorteur({
          porteur_id: "91001",
        });

        // When
        const resultat = await query.run({ porteurId: porteur.porteur_id });

        // Then
        expect(resultat).toEqual({
          estUtilise: false,
          nombrePerimetres: 0,
          nombreChantiers: 0,
        });
      }),
    );

    it(
      "retourne estUtilise à true avec le nombre de périmètres associés au porteur",
      createIntegrationTest(async () => {
        // Given
        const porteur = await fixtures.metadataPorteur({
          porteur_id: "91002",
        });
        await fixtures.metadataPerimetre({
          per_porteur_id: porteur.porteur_id,
        });

        // When
        const resultat = await query.run({ porteurId: porteur.porteur_id });

        // Then
        expect(resultat).toEqual({
          estUtilise: true,
          nombrePerimetres: 1,
          nombreChantiers: 0,
        });
      }),
    );

    it(
      "retourne estUtilise à true avec le nombre de chantiers associés au porteur en porteur principal, secondaire ou DAC",
      createIntegrationTest(async () => {
        // Given
        const porteur = await fixtures.metadataPorteur({
          porteur_id: "91003",
        });
        await fixtures.metadataChantier({
          porteur_id_principal: porteur.porteur_id,
        });
        await fixtures.metadataChantier({
          porteur_ids_secondaires: [porteur.porteur_id],
        });
        await fixtures.metadataChantier({
          porteur_ids_DAC: [porteur.porteur_id],
        });

        // When
        const resultat = await query.run({ porteurId: porteur.porteur_id });

        // Then
        expect(resultat).toEqual({
          estUtilise: true,
          nombrePerimetres: 0,
          nombreChantiers: 3,
        });
      }),
    );
  });
});
