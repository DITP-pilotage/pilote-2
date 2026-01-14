import { PrismaPilote } from "@/server/db/PrismaPilote";
import { ListerRattachementsPiloteEval } from "@/server/evaluation/queries/ListerRattachementsPiloteEval";
import { createIntegrationTest } from "@/server/infrastructure/test/createIntegrationTest";
import { fixtures } from "@/server/infrastructure/test/fixtures";

describe("ListerRattachementsPiloteEval", () => {
  let query: ListerRattachementsPiloteEval;
  const prismaPilote = new PrismaPilote();

  beforeEach(() => {
    query = new ListerRattachementsPiloteEval({ prisma: prismaPilote });
  });

  describe("run", () => {
    it(
      "retourne tous les rattachements",
      createIntegrationTest(async () => {
        // Given
        const groupe1 = await fixtures.rattachementGroupe({
          code: "REG",
          libelle: "Groupe Régions",
        });
        const groupe2 = await fixtures.rattachementGroupe({
          code: "DROM",
          libelle: "Groupe DROM",
        });

        await fixtures.rattachement({
          code: "REG-01",
          libelle: "Auvergne-Rhône-Alpes",
          groupe: groupe1.code,
          ordre: 1,
        });
        await fixtures.rattachement({
          code: "REG-02",
          libelle: "Bourgogne-Franche-Comté",
          groupe: groupe1.code,
          ordre: 2,
        });
        await fixtures.rattachement({
          code: "REG-03",
          libelle: "Bretagne",
          groupe: groupe1.code,
          ordre: 3,
        });
        await fixtures.rattachement({
          code: "DROM-01",
          libelle: "Guadeloupe",
          groupe: groupe2.code,
          ordre: 1,
        });
        await fixtures.rattachement({
          code: "DROM-02",
          libelle: "Martinique",
          groupe: groupe2.code,
          ordre: 2,
        });

        // When
        const resultat = await query.run();

        // Then
        expect(resultat).toHaveLength(5);
      }),
    );

    it(
      "retourne les champs code, libelle, groupe, ordre",
      createIntegrationTest(async () => {
        // Given
        const groupe = await fixtures.rattachementGroupe({
          code: "REG",
          libelle: "Groupe Régions",
        });

        await fixtures.rattachement({
          code: "REG-75",
          libelle: "Île-de-France",
          groupe: groupe.code,
          ordre: 10,
        });

        // When
        const resultat = await query.run();

        // Then
        expect(resultat).toHaveLength(1);
        expect(resultat[0]).toEqual({
          code: "REG-75",
          libelle: "Île-de-France",
          groupe: "REG",
          ordre: 10,
        });
      }),
    );

    it(
      "retourne un tableau vide si aucun rattachement",
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
