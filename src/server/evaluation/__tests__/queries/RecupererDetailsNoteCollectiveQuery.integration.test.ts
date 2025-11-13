import { RecupererDetailsNoteCollectiveQuery } from "@/server/evaluation/queries/RecupererDetailsNoteCollectiveQuery";
import { PrismaPilote } from "@/server/db/PrismaPilote";
import { prisma } from "@/server/db/prisma";

describe("RecupererDetailsNoteCollectiveQuery", () => {
  let query: RecupererDetailsNoteCollectiveQuery;
  const prismaPilote = new PrismaPilote();

  beforeEach(() => {
    query = new RecupererDetailsNoteCollectiveQuery({ prisma: prismaPilote });
  });

  describe("run", () => {
    it("doit retourner les chantiers évaluation pour un rattachement et jalon donnés", async () => {
      // Given
      const rattachementCode = "DEPT-75";
      const jalon = 2025;

      await prisma.ministere.createMany({
        data: [
          {
            id: "MIN-001",
            acronyme: "MIN1",
            nom: "Ministère 1",
            icone: "icone-ministere-1.svg",
          },
          {
            id: "MIN-002",
            acronyme: "MIN2",
            nom: "Ministère 2",
            icone: "icone-ministere-2.svg",
          },
        ],
      });

      await prisma.chantier_identite.createMany({
        data: [
          {
            id: "CH-101",
            nom: "Chantier Alpha",
            ministeres: ["MIN-001"],
          },
          {
            id: "CH-102",
            nom: "Chantier Beta",
            ministeres: ["MIN-002"],
          },
          {
            id: "CH-103",
            nom: "Chantier Gamma",
            ministeres: ["MIN-001"],
          },
        ],
      });

      await prisma.referentiel_rattachement.createMany({
        data: [
          {
            code: rattachementCode,
            libelle: "Département 75",
            groupe: rattachementCode,
            ordre: 1,
          },
          {
            code: "DEPT-01",
            libelle: "Département 01",
            groupe: rattachementCode,
            ordre: 1,
          },
        ],
      });

      await prisma.fiche_evaluation.createMany({
        data: [
          {
            id: "8b0af7d1-78d0-4926-b3ff-e55de6763228",
            rattachement_code: rattachementCode,
            jalon: jalon,
            etape_courante: "AUTO_EVALUATION",
          },
          {
            id: "503d8600-ad9e-4b8b-851c-6b7f0ba33d63",
            rattachement_code: "DEPT-01",
            jalon: jalon,
            etape_courante: "AUTO_EVALUATION",
          },
          {
            id: "9d4f1358-b418-450c-a136-07e5b7a4340e",
            rattachement_code: "DEPT-01",
            jalon: 2024,
            etape_courante: "AUTO_EVALUATION",
          },
        ],
      });

      await prisma.chantier_evaluation.createMany({
        data: [
          {
            id: "CH-101",
            territoire_code: rattachementCode,
            code_insee: "75",
            maille: "DEPT",
            zone_id: "zone-1",
            taux_avancement: 75.5,
            date_calcul: new Date("2025-02-15"),
            jalon: jalon,
          },
          {
            id: "CH-101",
            territoire_code: "DEPT-01",
            code_insee: "01",
            maille: "DEPT",
            zone_id: "zone-1",
            taux_avancement: 100,
            date_calcul: new Date("2025-02-15"),
            jalon: jalon,
          },
          {
            id: "CH-102",
            territoire_code: rattachementCode,
            code_insee: "75",
            maille: "DEPT",
            zone_id: "zone-1",
            taux_avancement: 82.3,
            date_calcul: new Date("2025-02-15"),
            jalon: jalon,
          },
          {
            id: "CH-102",
            territoire_code: "DEPT-01",
            code_insee: "01",
            maille: "DEPT",
            zone_id: "zone-1",
            taux_avancement: 100,
            date_calcul: new Date("2025-02-15"),
            jalon: 2024,
          },
          {
            id: "CH-103",
            territoire_code: rattachementCode,
            code_insee: "75",
            maille: "DEPT",
            zone_id: "zone-1",
            taux_avancement: 90,
            date_calcul: new Date("2025-02-15"),
            jalon: jalon,
          },
        ],
      });

      // When
      const result = await query.run({ rattachementCode, jalon });

      // Then
      expect(result).toEqual([
        {
          id: "CH-101",
          nom: "Chantier Alpha",
          icone_ministere: "icone-ministere-1.svg",
          taux_avancement: 75.5,
        },
        {
          id: "CH-102",
          nom: "Chantier Beta",
          icone_ministere: "icone-ministere-2.svg",
          taux_avancement: 82.3,
        },
        {
          id: "CH-103",
          nom: "Chantier Gamma",
          icone_ministere: "icone-ministere-1.svg",
          taux_avancement: 90,
        },
      ]);
    });

    it("ne doit retourner que les chantiers de la dernière date_calcul", async () => {
      // Given
      const rattachementCode = "REG-302";
      const jalon = 2025;

      await prisma.ministere.create({
        data: {
          id: "MIN-003",
          acronyme: "MIN3",
          nom: "Ministère 3",
          icone: "icone-ministere-3.svg",
        },
      });

      await prisma.chantier_identite.createMany({
        data: [
          {
            id: "CH-201",
            nom: "Chantier Delta",
            ministeres: ["MIN-003"],
          },
          {
            id: "CH-202",
            nom: "Chantier Epsilon",
            ministeres: ["MIN-003"],
          },
        ],
      });

      await prisma.referentiel_rattachement.create({
        data: {
          code: rattachementCode,
          groupe: rattachementCode,
          ordre: 1,
          libelle: "Région 302",
        },
      });

      await prisma.fiche_evaluation.create({
        data: {
          id: "9d4f1358-b418-450c-a136-07e5b7a4340e",
          rattachement_code: rattachementCode,
          jalon: jalon,
          etape_courante: "AUTO_EVALUATION",
        },
      });

      await prisma.chantier_evaluation.createMany({
        data: [
          {
            id: "CH-201",
            territoire_code: rattachementCode,
            code_insee: "302",
            maille: "REG",
            zone_id: "zone-2",
            taux_avancement: 40,
            date_calcul: new Date("2025-01-10"),
            jalon: jalon,
          },
          {
            id: "CH-202",
            territoire_code: rattachementCode,
            code_insee: "302",
            maille: "REG",
            zone_id: "zone-2",
            taux_avancement: 45,
            date_calcul: new Date("2025-01-10"),
            jalon: jalon,
          },
          {
            id: "CH-201",
            territoire_code: rattachementCode,
            code_insee: "302",
            maille: "REG",
            zone_id: "zone-2",
            taux_avancement: 65,
            date_calcul: new Date("2025-02-20"),
            jalon: jalon,
          },
          {
            id: "CH-202",
            territoire_code: rattachementCode,
            code_insee: "302",
            maille: "REG",
            zone_id: "zone-2",
            taux_avancement: 70,
            date_calcul: new Date("2025-02-20"),
            jalon: jalon,
          },
        ],
      });

      // When
      const result = await query.run({ rattachementCode, jalon });

      // Then
      expect(result).toEqual([
        {
          id: "CH-201",
          nom: "Chantier Delta",
          icone_ministere: "icone-ministere-3.svg",
          taux_avancement: 65,
        },
        {
          id: "CH-202",
          nom: "Chantier Epsilon",
          icone_ministere: "icone-ministere-3.svg",
          taux_avancement: 70,
        },
      ]);
    });

    it("doit retourner une liste vide si aucun chantier pour le rattachement", async () => {
      // Given
      const rattachementCodeInexistant = "REG-999";
      const jalon = 2025;

      // When
      const result = await query.run({
        rattachementCode: rattachementCodeInexistant,
        jalon,
      });

      // Then
      expect(result).toEqual([]);
    });

    it("doit gérer correctement les chantiers sans ministère", async () => {
      // Given
      const rattachementCode = "REG-304";
      const jalon = 2025;

      await prisma.chantier_identite.create({
        data: {
          id: "CH-401",
          nom: "Chantier Sans Ministère",
          ministeres: [],
        },
      });

      await prisma.referentiel_rattachement.create({
        data: {
          code: rattachementCode,
          groupe: rattachementCode,
          ordre: 1,
          libelle: "Région 304",
        },
      });

      await prisma.fiche_evaluation.create({
        data: {
          id: "9d4f1358-b418-450c-a136-07e5b7a4340e",
          rattachement_code: rattachementCode,
          jalon: jalon,
          etape_courante: "AUTO_EVALUATION",
        },
      });

      await prisma.chantier_evaluation.create({
        data: {
          id: "CH-401",
          territoire_code: rattachementCode,
          code_insee: "304",
          maille: "REG",
          zone_id: "zone-4",
          taux_avancement: 88,
          date_calcul: new Date("2025-03-05"),
          jalon: jalon,
        },
      });

      // When
      const result = await query.run({ rattachementCode, jalon });

      // Then
      expect(result).toEqual([
        {
          id: "CH-401",
          nom: "Chantier Sans Ministère",
          icone_ministere: null,
          taux_avancement: 88,
        },
      ]);
    });
  });
});
