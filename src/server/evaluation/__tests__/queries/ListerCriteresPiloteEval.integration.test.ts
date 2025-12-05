import { PrismaPilote } from "@/server/db/PrismaPilote";
import { prisma } from "@/server/db/prisma";
import { ListerCriteresPiloteEval } from "@/server/evaluation/queries/ListerCriteresPiloteEval";

describe("ListerCriteresPiloteEval", () => {
  let query: ListerCriteresPiloteEval;
  const prismaPilote = new PrismaPilote();

  beforeEach(() => {
    query = new ListerCriteresPiloteEval({ prisma: prismaPilote });
  });

  describe("run", () => {
    it("retourne tous les critères", async () => {
      // Given
      const critere1Id = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";
      const critere2Id = "b2c3d4e5-f6a7-8901-bcde-f12345678901";
      const critere3Id = "c3d4e5f6-a7b8-9012-cdef-123456789012";

      await prisma.referentiel_critere.create({
        data: {
          id: critere1Id,
          libelle: "Critère 1",
          descriptif: "Description du critère 1",
        },
      });

      await prisma.referentiel_critere.create({
        data: {
          id: critere2Id,
          libelle: "Critère 2",
          descriptif: "Description du critère 2",
        },
      });

      await prisma.referentiel_critere.create({
        data: {
          id: critere3Id,
          libelle: "Critère 3",
          descriptif: "Description du critère 3",
        },
      });

      // When
      const resultat = await query.run();

      // Then
      expect(resultat).toHaveLength(3);
    });

    it("retourne les champs id et libelle uniquement", async () => {
      // Given
      const critereId = "d4e5f6a7-b8c9-0123-def0-123456789013";

      await prisma.referentiel_critere.create({
        data: {
          id: critereId,
          libelle: "Critère test",
          descriptif: "Description du critère test",
        },
      });

      // When
      const resultat = await query.run();

      // Then
      expect(resultat).toHaveLength(1);
      expect(resultat[0]).toEqual({
        id: critereId,
        libelle: "Critère test",
      });
      expect(resultat[0]).not.toHaveProperty("descriptif");
      expect(resultat[0]).not.toHaveProperty("sousCriteres");
    });

    it("retourne un tableau vide si aucun critère", async () => {
      // Given: aucun critère dans la base

      // When
      const resultat = await query.run();

      // Then
      expect(resultat).toEqual([]);
    });
  });
});
