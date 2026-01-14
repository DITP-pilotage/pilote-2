import { PrismaPilote } from "@/server/db/PrismaPilote";
import { ListerCriteresPiloteEval } from "@/server/evaluation/queries/ListerCriteresPiloteEval";
import { createIntegrationTest } from "@/server/infrastructure/test/createIntegrationTest";
import { fixtures } from "@/server/infrastructure/test/fixtures";

describe("ListerCriteresPiloteEval", () => {
  let query: ListerCriteresPiloteEval;
  const prismaPilote = new PrismaPilote();

  beforeEach(() => {
    query = new ListerCriteresPiloteEval({ prisma: prismaPilote });
  });

  describe("run", () => {
    it(
      "retourne tous les critères",
      createIntegrationTest(async () => {
        // Given
        await fixtures.critere({ libelle: "Critère 1" });
        await fixtures.critere({ libelle: "Critère 2" });
        await fixtures.critere({ libelle: "Critère 3" });

        // When
        const resultat = await query.run();

        // Then
        expect(resultat).toHaveLength(3);
      }),
    );

    it(
      "retourne les champs id et libelle uniquement",
      createIntegrationTest(async () => {
        // Given
        const critere = await fixtures.critere({
          libelle: "Critère test",
          descriptif: "Description du critère test",
        });

        // When
        const resultat = await query.run();

        // Then
        expect(resultat).toHaveLength(1);
        expect(resultat[0]).toEqual({
          id: critere.id,
          libelle: "Critère test",
        });
        expect(resultat[0]).not.toHaveProperty("descriptif");
        expect(resultat[0]).not.toHaveProperty("sousCriteres");
      }),
    );

    it(
      "retourne un tableau vide si aucun critère",
      createIntegrationTest(async () => {
        // Given

        // When
        const resultat = await query.run();

        // Then
        expect(resultat).toEqual([]);
      }),
    );
  });
});
