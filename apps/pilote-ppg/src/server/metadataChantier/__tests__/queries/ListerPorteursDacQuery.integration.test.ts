import { PrismaPilote } from "@/server/db/PrismaPilote";
import { ListerPorteursDacQuery } from "@/server/metadataChantier/queries/ListerPorteursDacQuery";
import { createIntegrationTest } from "@/server/infrastructure/test/createIntegrationTest";
import { getPrisma } from "@/server/db/PrismaTransaction";

describe("ListerPorteursDacQuery", () => {
  let query: ListerPorteursDacQuery;
  const prismaPilote = new PrismaPilote();

  beforeEach(() => {
    query = new ListerPorteursDacQuery({ prisma: prismaPilote });
  });

  describe("run", () => {
    it(
      "retourne un tableau vide si aucun porteur DAC",
      createIntegrationTest(async () => {
        // Given

        // When
        const resultat = await query.run();

        // Then
        expect(resultat).toEqual([]);
      }),
    );

    it(
      "retourne uniquement les porteurs de type DAC triés par porteur_id",
      createIntegrationTest(async () => {
        // Given
        const prisma = getPrisma();
        await prisma.metadata_porteurs.create({
          data: { porteur_id: "DAC-B", porteur_short: "DAC B", porteur_name: "DAC B", porteur_type_short: "DAC" },
        });
        await prisma.metadata_porteurs.create({
          data: { porteur_id: "DAC-A", porteur_short: "DAC A", porteur_name: "DAC A", porteur_type_short: "DAC" },
        });
        await prisma.metadata_porteurs.create({
          // Ce porteur MIN ne doit pas apparaître
          data: { porteur_id: "MIN-X", porteur_short: "MIN X", porteur_name: "MIN X", porteur_type_short: "MIN" },
        });

        // When
        const resultat = await query.run();

        // Then
        expect(resultat).toEqual([
          { id: "DAC-A", label: "DAC A" },
          { id: "DAC-B", label: "DAC B" },
        ]);
      }),
    );
  });
});
