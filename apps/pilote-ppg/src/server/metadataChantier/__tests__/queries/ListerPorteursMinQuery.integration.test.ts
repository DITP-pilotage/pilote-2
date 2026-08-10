import { PrismaPilote } from "@/server/db/PrismaPilote";
import { ListerPorteursMinQuery } from "@/server/metadataChantier/queries/ListerPorteursMinQuery";
import { createIntegrationTest } from "@/server/infrastructure/test/createIntegrationTest";
import { getPrisma } from "@/server/db/PrismaTransaction";

describe("ListerPorteursMinQuery", () => {
  let query: ListerPorteursMinQuery;
  const prismaPilote = new PrismaPilote();

  beforeEach(() => {
    query = new ListerPorteursMinQuery({ prisma: prismaPilote });
  });

  describe("run", () => {
    it(
      "retourne un tableau vide si aucun porteur MIN",
      createIntegrationTest(async () => {
        // Given

        // When
        const resultat = await query.run();

        // Then
        expect(resultat).toEqual([]);
      }),
    );

    it(
      "retourne uniquement les porteurs de type MIN triés par porteur_id",
      createIntegrationTest(async () => {
        // Given
        const prisma = getPrisma();
        await prisma.metadata_porteurs.create({
          data: { porteur_id: "MIN-B", porteur_short: "B court", porteur_name: "Ministère B", porteur_type_short: "MIN" },
        });
        await prisma.metadata_porteurs.create({
          data: { porteur_id: "MIN-A", porteur_short: "A court", porteur_name: "Ministère A", porteur_type_short: "MIN" },
        });
        await prisma.metadata_porteurs.create({
          // Ce porteur DAC ne doit pas apparaître
          data: { porteur_id: "DAC-X", porteur_short: "DAC X", porteur_name: "DAC X", porteur_type_short: "DAC" },
        });

        // When
        const resultat = await query.run();

        // Then
        expect(resultat).toEqual([
          { id: "MIN-A", label: "A court" },
          { id: "MIN-B", label: "B court" },
        ]);
      }),
    );

    it(
      "utilise porteur_name_short en priorité sur porteur_short",
      createIntegrationTest(async () => {
        // Given
        const prisma = getPrisma();
        await prisma.metadata_porteurs.create({
          data: {
            porteur_id: "MIN-01",
            porteur_short: "Court",
            porteur_name: "Long",
            porteur_name_short: "Court préféré",
            porteur_type_short: "MIN",
          },
        });

        // When
        const resultat = await query.run();

        // Then
        expect(resultat).toEqual([{ id: "MIN-01", label: "Court préféré" }]);
      }),
    );
  });
});
