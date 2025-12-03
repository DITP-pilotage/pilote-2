import { PrismaPilote } from "@/server/db/PrismaPilote";
import { prisma } from "@/server/db/prisma";
import { ListerRattachementsPiloteEval } from "@/server/evaluation/queries/ListerRattachementsPiloteEval";

describe("ListerRattachementsPiloteEval", () => {
  let query: ListerRattachementsPiloteEval;
  const prismaPilote = new PrismaPilote();

  beforeEach(() => {
    query = new ListerRattachementsPiloteEval({ prisma: prismaPilote });
  });

  describe("run", () => {
    it("retourne tous les rattachements", async () => {
      // Given
      await prisma.referentiel_rattachement.createMany({
        data: [
          {
            code: "REG-01",
            libelle: "Auvergne-Rhône-Alpes",
            groupe: "REG",
            ordre: 1,
          },
          {
            code: "REG-02",
            libelle: "Bourgogne-Franche-Comté",
            groupe: "REG",
            ordre: 2,
          },
          {
            code: "REG-03",
            libelle: "Bretagne",
            groupe: "REG",
            ordre: 3,
          },
          {
            code: "DROM-01",
            libelle: "Guadeloupe",
            groupe: "DROM",
            ordre: 1,
          },
          {
            code: "DROM-02",
            libelle: "Martinique",
            groupe: "DROM",
            ordre: 2,
          },
        ],
      });

      // When
      const resultat = await query.run();

      // Then
      expect(resultat).toHaveLength(5);
    });

    it("retourne les champs code, libelle, groupe, ordre", async () => {
      // Given
      await prisma.referentiel_rattachement.create({
        data: {
          code: "REG-75",
          libelle: "Île-de-France",
          groupe: "REG",
          ordre: 10,
        },
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
    });

    it("retourne un tableau vide si aucun rattachement", async () => {
      // Given: aucun rattachement dans la base

      // When
      const resultat = await query.run();

      // Then
      expect(resultat).toEqual([]);
    });
  });
});
