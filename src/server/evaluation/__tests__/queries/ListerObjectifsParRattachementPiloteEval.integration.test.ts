import { PrismaPilote } from "@/server/db/PrismaPilote";
import { prisma } from "@/server/db/prisma";
import { ListerObjectifsParRattachementPiloteEval } from "@/server/evaluation/queries/ListerObjectifsParRattachementPiloteEval";

describe("ListerObjectifsParRattachementPiloteEval", () => {
  let query: ListerObjectifsParRattachementPiloteEval;
  const prismaPilote = new PrismaPilote();

  beforeEach(() => {
    query = new ListerObjectifsParRattachementPiloteEval({
      prisma: prismaPilote,
    });
  });

  describe("run", () => {
    it("retourne les objectifs groupés par rattachement pour un jalon donné", async () => {
      // Given
      const rattachement1Code = "REG-01";
      const rattachement2Code = "REG-02";
      const objectif1Id = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";
      const objectif2Id = "b2c3d4e5-f6a7-8901-bcde-f12345678901";
      const objectif3Id = "c3d4e5f6-a7b8-9012-cdef-123456789012";
      const objectif4Id = "d4e5f6a7-b8c9-0123-def0-123456789013";

      await prisma.referentiel_rattachement.createMany({
        data: [
          {
            code: rattachement1Code,
            libelle: "Rattachement 1",
            groupe: "REG",
            ordre: 1,
          },
          {
            code: rattachement2Code,
            libelle: "Rattachement 2",
            groupe: "REG",
            ordre: 2,
          },
        ],
      });

      await prisma.referentiel_objectif.createMany({
        data: [
          {
            id: objectif1Id,
            libelle: "Objectif 1 - Jalon 2025",
            descriptif: "Description objectif 1",
            indicateur_cible: "Indicateur 1",
            jalon: 2025,
            rattachement_code: rattachement1Code,
          },
          {
            id: objectif2Id,
            libelle: "Objectif 2 - Jalon 2025",
            descriptif: "Description objectif 2",
            indicateur_cible: "Indicateur 2",
            jalon: 2025,
            rattachement_code: rattachement1Code,
          },
          {
            id: objectif3Id,
            libelle: "Objectif 3 - Jalon 2025",
            descriptif: "Description objectif 3",
            indicateur_cible: "Indicateur 3",
            jalon: 2025,
            rattachement_code: rattachement2Code,
          },
          {
            id: objectif4Id,
            libelle: "Objectif 4 - Jalon 2026",
            descriptif: "Description objectif 4",
            indicateur_cible: "Indicateur 4",
            jalon: 2026,
            rattachement_code: rattachement1Code,
          },
        ],
      });

      // When
      const resultat = await query.run({ jalon: 2025 });

      // Then
      expect(Object.keys(resultat)).toHaveLength(2);
      expect(resultat[rattachement1Code]).toHaveLength(2);
      expect(resultat[rattachement2Code]).toHaveLength(1);
    });

    it("retourne uniquement les champs id et libelle pour chaque objectif", async () => {
      // Given
      const rattachementCode = "REG-10";
      const tutelleId = "e5f6a7b8-c9d0-1234-ef01-234567890123";
      const objectifId = "f6a7b8c9-d0e1-2345-f012-345678901234";

      await prisma.referentiel_rattachement.create({
        data: {
          code: rattachementCode,
          libelle: "Rattachement test",
          groupe: "REG",
          ordre: 10,
        },
      });

      await prisma.referentiel_tutelle.create({
        data: {
          id: tutelleId,
          nom: "Tutelle test",
        },
      });

      await prisma.referentiel_objectif.create({
        data: {
          id: objectifId,
          libelle: "Objectif test",
          descriptif: "Description de l'objectif",
          indicateur_cible: "Indicateur cible",
          jalon: 2025,
          rattachement_code: rattachementCode,
          tutelle_id: tutelleId,
        },
      });

      // When
      const resultat = await query.run({ jalon: 2025 });

      // Then
      expect(resultat[rattachementCode]).toHaveLength(1);
      expect(resultat[rattachementCode][0]).toEqual({
        id: objectifId,
        libelle: "Objectif test",
      });
    });

    it("retourne un objet vide si aucun objectif pour le jalon donné", async () => {
      // Given
      const rattachementCode = "REG-30";
      const objectifId = "c9d0e1f2-a3b4-5678-2345-678901234567";

      await prisma.referentiel_rattachement.create({
        data: {
          code: rattachementCode,
          libelle: "Rattachement",
          groupe: "REG",
          ordre: 30,
        },
      });

      await prisma.referentiel_objectif.create({
        data: {
          id: objectifId,
          libelle: "Objectif 2026",
          descriptif: "Description",
          indicateur_cible: "Indicateur",
          jalon: 2026,
          rattachement_code: rattachementCode,
        },
      });

      // When
      const resultat = await query.run({ jalon: 2025 });

      // Then
      expect(resultat).toEqual({});
    });
  });
});
