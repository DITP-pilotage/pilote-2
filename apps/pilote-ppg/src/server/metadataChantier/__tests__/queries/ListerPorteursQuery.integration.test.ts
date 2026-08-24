import { PrismaPilote } from "@/server/db/PrismaPilote";
import { ListerPorteursQuery } from "@/server/metadataChantier/queries/ListerPorteursQuery";
import { createIntegrationTest } from "@/server/infrastructure/test/createIntegrationTest";
import { getPrisma } from "@/server/db/PrismaTransaction";
import { fixtures } from "@/server/infrastructure/test/fixtures";

describe("ListerPorteursQuery", () => {
  let query: ListerPorteursQuery;
  const prismaPilote = new PrismaPilote();

  beforeEach(() => {
    query = new ListerPorteursQuery({ prisma: prismaPilote });
  });

  describe("run", () => {
    it(
      "retourne un tableau vide si aucun porteur",
      createIntegrationTest(async () => {
        // Given

        // When
        const resultat = await query.run();

        // Then
        expect(resultat).toEqual([]);
      }),
    );

    it(
      "retourne tous les porteurs sans filtre, triés par porteur_id",
      createIntegrationTest(async () => {
        // Given
        const prisma = getPrisma();
        await prisma.metadata_porteurs.create({
          data: {
            porteur_id: "DAC-A",
            porteur_short: "DAC A court",
            porteur_name: "DAC A long",
            porteur_type: "DAC",
          },
        });
        await prisma.metadata_porteurs.create({
          data: {
            porteur_id: "MIN-A",
            porteur_short: "MIN A court",
            porteur_name: "Ministère A",
            porteur_type: "MIN",
          },
        });

        // When
        const resultat = await query.run();

        // Then
        expect(resultat).toEqual([
          { id: "DAC-A", label: "DAC A long" },
          { id: "MIN-A", label: "Ministère A" },
        ]);
      }),
    );

    it(
      "filtre sur le type MIN et retourne porteur_name comme label",
      createIntegrationTest(async () => {
        // Given
        const prisma = getPrisma();
        await prisma.metadata_porteurs.create({
          data: {
            porteur_id: "MIN-B",
            porteur_short: "B court",
            porteur_name: "Ministère B",
            porteur_type: "MIN",
          },
        });
        await prisma.metadata_porteurs.create({
          data: {
            porteur_id: "MIN-A",
            porteur_short: "A court",
            porteur_name: "Ministère A",
            porteur_type: "MIN",
          },
        });
        await prisma.metadata_porteurs.create({
          // Ce porteur DAC ne doit pas apparaître
          data: {
            porteur_id: "DAC-X",
            porteur_short: "DAC X",
            porteur_name: "DAC X",
            porteur_type: "DAC",
          },
        });

        // When
        const resultat = await query.run({ type: "MIN" });

        // Then
        expect(resultat).toEqual([
          { id: "MIN-A", label: "Ministère A" },
          { id: "MIN-B", label: "Ministère B" },
        ]);
      }),
    );

    it(
      "filtre sur le type DAC",
      createIntegrationTest(async () => {
        // Given
        const prisma = getPrisma();
        await prisma.metadata_porteurs.create({
          data: {
            porteur_id: "DAC-B",
            porteur_short: "DAC B court",
            porteur_name: "DAC B long",
            porteur_type: "DAC",
          },
        });
        await prisma.metadata_porteurs.create({
          data: {
            porteur_id: "DAC-A",
            porteur_short: "DAC A court",
            porteur_name: "DAC A long",
            porteur_type: "DAC",
          },
        });
        await prisma.metadata_porteurs.create({
          // Ce porteur MIN ne doit pas apparaître
          data: {
            porteur_id: "MIN-X",
            porteur_short: "MIN X",
            porteur_name: "MIN X",
            porteur_type: "MIN",
          },
        });

        // When
        const resultat = await query.run({ type: "DAC" });

        // Then
        expect(resultat).toEqual([
          { id: "DAC-A", label: "DAC A long" },
          { id: "DAC-B", label: "DAC B long" },
        ]);
      }),
    );

    it(
      "exclut les porteurs supprimés",
      createIntegrationTest(async () => {
        // Given
        await fixtures.metadataPorteur({
          porteur_id: "20001",
          porteur_type: "MIN",
        });
        await fixtures.metadataPorteur({
          porteur_id: "20002",
          porteur_type: "MIN",
          deleted_at: new Date("2026-01-01"),
        });

        // When
        const resultat = await query.run();

        // Then
        const ids = resultat.map((p) => p.id);
        expect(ids).toContain("20001");
        expect(ids).not.toContain("20002");
      }),
    );
  });
});
