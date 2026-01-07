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

      await prisma.referentiel_rattachement_groupe.createMany({
        data: [
          {
            code: rattachementCode,
            libelle: "Groupe Département 75",
            ordre: 1,
          },
          { code: "DEPT-01", libelle: "Groupe Département 01", ordre: 1 },
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

      await prisma.chantier_territoire.createMany({
        data: [
          {
            id: "CH-101",
            territoire_code: rattachementCode,
            code_insee: "75",
            maille: "DEPT",
            zone_id: "zone-1",
          },
          {
            id: "CH-101",
            territoire_code: "DEPT-01",
            code_insee: "01",
            maille: "DEPT",
            zone_id: "zone-1",
          },
          {
            id: "CH-102",
            territoire_code: rattachementCode,
            code_insee: "75",
            maille: "DEPT",
            zone_id: "zone-1",
          },
          {
            id: "CH-102",
            territoire_code: "DEPT-01",
            code_insee: "01",
            maille: "DEPT",
            zone_id: "zone-1",
          },
          {
            id: "CH-103",
            territoire_code: rattachementCode,
            code_insee: "75",
            maille: "DEPT",
            zone_id: "zone-1",
          },
        ],
      });

      await prisma.chantier_territoire_jalon.createMany({
        data: [
          {
            id: "CH-101",
            territoire_code: rattachementCode,
            code_insee: "75",
            maille: "DEPT",
            zone_id: "zone-1",
            jalon: jalon,
            taux_avancement: 80.0,
          },
          {
            id: "CH-101",
            territoire_code: "DEPT-01",
            code_insee: "01",
            maille: "DEPT",
            zone_id: "zone-1",
            jalon: jalon,
            taux_avancement: 95.0,
          },
          {
            id: "CH-102",
            territoire_code: rattachementCode,
            code_insee: "75",
            maille: "DEPT",
            zone_id: "zone-1",
            jalon: jalon,
            taux_avancement: 85.0,
          },
          {
            id: "CH-102",
            territoire_code: "DEPT-01",
            code_insee: "01",
            maille: "DEPT",
            zone_id: "zone-1",
            jalon: 2024,
            taux_avancement: 90.0,
          },
          {
            id: "CH-103",
            territoire_code: rattachementCode,
            code_insee: "75",
            maille: "DEPT",
            zone_id: "zone-1",
            jalon: jalon,
            taux_avancement: 92.0,
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
          iconeMinistere: "icone-ministere-1.svg",
          tauxAvancement: 75.5,
          tauxAvancementPilote: 80.0,
          indicateurs: [],
        },
        {
          id: "CH-102",
          nom: "Chantier Beta",
          iconeMinistere: "icone-ministere-2.svg",
          tauxAvancement: 82.3,
          tauxAvancementPilote: 85.0,
          indicateurs: [],
        },
        {
          id: "CH-103",
          nom: "Chantier Gamma",
          iconeMinistere: "icone-ministere-1.svg",
          tauxAvancement: 90,
          tauxAvancementPilote: 92.0,
          indicateurs: [],
        },
      ]);
    });

    it("ne doit retourner que les chantiers de la dernière date_calcul", async () => {
      // Given
      const rattachementCode = "REG-84";
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

      await prisma.referentiel_rattachement_groupe.createMany({
        data: [
          {
            code: rattachementCode,
            libelle: "Groupe rattachement",
            ordre: 1,
          },
        ],
      });

      await prisma.referentiel_rattachement.create({
        data: {
          code: rattachementCode,
          groupe: rattachementCode,
          ordre: 1,
          libelle: "Région 84",
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

      await prisma.chantier_territoire.createMany({
        data: [
          {
            id: "CH-201",
            territoire_code: rattachementCode,
            code_insee: "84",
            maille: "REG",
            zone_id: "zone-2",
          },
          {
            id: "CH-202",
            territoire_code: rattachementCode,
            code_insee: "84",
            maille: "REG",
            zone_id: "zone-2",
          },
        ],
      });

      await prisma.chantier_territoire_jalon.createMany({
        data: [
          {
            id: "CH-201",
            territoire_code: rattachementCode,
            code_insee: "84",
            maille: "REG",
            zone_id: "zone-2",
            jalon: jalon,
            taux_avancement: 68.0,
          },
          {
            id: "CH-202",
            territoire_code: rattachementCode,
            code_insee: "84",
            maille: "REG",
            zone_id: "zone-2",
            jalon: jalon,
            taux_avancement: 73.0,
          },
        ],
      });

      await prisma.chantier_evaluation.createMany({
        data: [
          {
            id: "CH-201",
            territoire_code: rattachementCode,
            code_insee: "84",
            maille: "REG",
            zone_id: "zone-2",
            taux_avancement: 40,
            date_calcul: new Date("2025-01-10"),
            jalon: jalon,
          },
          {
            id: "CH-202",
            territoire_code: rattachementCode,
            code_insee: "84",
            maille: "REG",
            zone_id: "zone-2",
            taux_avancement: 45,
            date_calcul: new Date("2025-01-10"),
            jalon: jalon,
          },
          {
            id: "CH-201",
            territoire_code: rattachementCode,
            code_insee: "84",
            maille: "REG",
            zone_id: "zone-2",
            taux_avancement: 65,
            date_calcul: new Date("2025-02-20"),
            jalon: jalon,
          },
          {
            id: "CH-202",
            territoire_code: rattachementCode,
            code_insee: "84",
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
          iconeMinistere: "icone-ministere-3.svg",
          tauxAvancement: 65,
          tauxAvancementPilote: 68.0,
          indicateurs: [],
        },
        {
          id: "CH-202",
          nom: "Chantier Epsilon",
          iconeMinistere: "icone-ministere-3.svg",
          tauxAvancement: 70,
          tauxAvancementPilote: 73.0,
          indicateurs: [],
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
      const rattachementCode = "REG-84";
      const jalon = 2025;

      await prisma.chantier_identite.create({
        data: {
          id: "CH-401",
          nom: "Chantier Sans Ministère",
          ministeres: [],
        },
      });

      await prisma.referentiel_rattachement_groupe.create({
        data: {
          code: rattachementCode,
          libelle: "Groupe Région 84",
          ordre: 1,
        },
      });

      await prisma.referentiel_rattachement.create({
        data: {
          code: rattachementCode,
          groupe: rattachementCode,
          ordre: 1,
          libelle: "Région 84",
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

      await prisma.chantier_territoire.create({
        data: {
          id: "CH-401",
          territoire_code: rattachementCode,
          code_insee: "84",
          maille: "REG",
          zone_id: "zone-4",
        },
      });

      await prisma.chantier_territoire_jalon.create({
        data: {
          id: "CH-401",
          territoire_code: rattachementCode,
          code_insee: "84",
          maille: "REG",
          zone_id: "zone-4",
          jalon: jalon,
          taux_avancement: 91.0,
        },
      });

      await prisma.chantier_evaluation.create({
        data: {
          id: "CH-401",
          territoire_code: rattachementCode,
          code_insee: "84",
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
          iconeMinistere: null,
          tauxAvancement: 88,
          tauxAvancementPilote: 91.0,
          indicateurs: [],
        },
      ]);
    });

    it("doit remonter les indicateurs liés au chantier evaluation", async () => {
      // Given
      const rattachementCode = "DEPT-44";
      const jalon = 2025;

      await prisma.ministere.createMany({
        data: [
          {
            id: "MIN-500",
            acronyme: "MIN5",
            nom: "Ministère 5",
            icone: "icone-ministere-5.svg",
          },
        ],
      });

      await prisma.chantier_identite.createMany({
        data: [
          {
            id: "CH-500",
            nom: "Chantier avec Indicateurs",
            ministeres: ["MIN-500"],
          },
          {
            id: "CH-501",
            nom: "Autre Chantier",
            ministeres: ["MIN-500"],
          },
        ],
      });

      await prisma.indicateur_identite.createMany({
        data: [
          {
            id: "IND-001",
            nom: "Indicateur Alpha",
            chantier_id: "CH-500",
          },
          {
            id: "IND-002",
            nom: "Indicateur Beta",
            chantier_id: "CH-500",
          },
          {
            id: "IND-003",
            nom: "Indicateur Gamma",
            chantier_id: "CH-500",
          },
          {
            id: "IND-004",
            nom: "Indicateur Autre Chantier",
            chantier_id: "CH-501",
          },
          {
            id: "IND-005",
            nom: "Indicateur Autre Territoire",
            chantier_id: "CH-500",
          },
        ],
      });

      await prisma.referentiel_rattachement_groupe.createMany({
        data: [
          {
            code: rattachementCode,
            libelle: "Groupe Département 44",
            ordre: 1,
          },
          { code: "DEPT-33", libelle: "Groupe Département 33", ordre: 1 },
        ],
      });

      await prisma.referentiel_rattachement.createMany({
        data: [
          {
            code: rattachementCode,
            groupe: rattachementCode,
            ordre: 1,
            libelle: "Département 44",
          },
          {
            code: "DEPT-33",
            groupe: "DEPT-33",
            ordre: 1,
            libelle: "Département 33",
          },
        ],
      });

      await prisma.fiche_evaluation.createMany({
        data: [
          {
            id: "a1b2c3d4-e5f6-4789-a012-3456789abcde",
            rattachement_code: rattachementCode,
            jalon: jalon,
            etape_courante: "AUTO_EVALUATION",
          },
          {
            id: "b2c3d4e5-f6a7-4890-b123-456789abcdef",
            rattachement_code: "DEPT-33",
            jalon: jalon,
            etape_courante: "AUTO_EVALUATION",
          },
        ],
      });

      await prisma.chantier_territoire.createMany({
        data: [
          {
            id: "CH-500",
            territoire_code: rattachementCode,
            code_insee: "44",
            maille: "DEPT",
            zone_id: "zone-500",
          },
          {
            id: "CH-501",
            territoire_code: rattachementCode,
            code_insee: "44",
            maille: "DEPT",
            zone_id: "zone-500",
          },
          {
            id: "CH-500",
            territoire_code: "DEPT-33",
            code_insee: "33",
            maille: "DEPT",
            zone_id: "zone-501",
          },
        ],
      });

      await prisma.chantier_territoire_jalon.createMany({
        data: [
          {
            id: "CH-500",
            territoire_code: rattachementCode,
            code_insee: "44",
            maille: "DEPT",
            zone_id: "zone-500",
            jalon: jalon,
            taux_avancement: 78.5,
          },
          {
            id: "CH-501",
            territoire_code: rattachementCode,
            code_insee: "44",
            maille: "DEPT",
            zone_id: "zone-500",
            jalon: jalon,
            taux_avancement: 55.0,
          },
          {
            id: "CH-500",
            territoire_code: "DEPT-33",
            code_insee: "33",
            maille: "DEPT",
            zone_id: "zone-501",
            jalon: jalon,
            taux_avancement: 65.0,
          },
        ],
      });

      await prisma.chantier_evaluation.createMany({
        data: [
          {
            id: "CH-500",
            territoire_code: rattachementCode,
            code_insee: "44",
            maille: "DEPT",
            zone_id: "zone-500",
            taux_avancement: 72.8,
            date_calcul: new Date("2025-03-10"),
            jalon: jalon,
          },
          {
            id: "CH-500",
            territoire_code: rattachementCode,
            code_insee: "44",
            maille: "DEPT",
            zone_id: "zone-500",
            taux_avancement: 72.8,
            date_calcul: new Date("2025-02-01"),
            jalon: jalon,
          },
          {
            id: "CH-501",
            territoire_code: rattachementCode,
            code_insee: "44",
            maille: "DEPT",
            zone_id: "zone-500",
            taux_avancement: 50.0,
            date_calcul: new Date("2025-03-10"),
            jalon: jalon,
          },
          {
            id: "CH-500",
            territoire_code: "DEPT-33",
            code_insee: "33",
            maille: "DEPT",
            zone_id: "zone-501",
            taux_avancement: 60.0,
            date_calcul: new Date("2025-03-10"),
            jalon: jalon,
          },
        ],
      });

      await prisma.indicateur_territoire.createMany({
        data: [
          {
            id: "IND-001",
            chantier_id: "CH-500",
            territoire_code: rattachementCode,
            code_insee: "44",
            maille: "DEPT",
            zone_id: "zone-500",
          },
          {
            id: "IND-002",
            chantier_id: "CH-500",
            territoire_code: rattachementCode,
            code_insee: "44",
            maille: "DEPT",
            zone_id: "zone-500",
          },
          {
            id: "IND-003",
            chantier_id: "CH-500",
            territoire_code: rattachementCode,
            code_insee: "44",
            maille: "DEPT",
            zone_id: "zone-500",
          },
          {
            id: "IND-004",
            chantier_id: "CH-501",
            territoire_code: rattachementCode,
            code_insee: "44",
            maille: "DEPT",
            zone_id: "zone-500",
          },
          {
            id: "IND-005",
            chantier_id: "CH-500",
            territoire_code: "DEPT-33",
            code_insee: "33",
            maille: "DEPT",
            zone_id: "zone-501",
          },
        ],
      });

      await prisma.indicateur_territoire_jalon.createMany({
        data: [
          {
            id: "IND-001",
            territoire_code: rattachementCode,
            code_insee: "44",
            maille: "DEPT",
            zone_id: "zone-500",
            jalon: jalon,
            taux_avancement: 85.0,
          },
          {
            id: "IND-002",
            territoire_code: rattachementCode,
            code_insee: "44",
            maille: "DEPT",
            zone_id: "zone-500",
            jalon: jalon,
            taux_avancement: 92.5,
          },
          {
            id: "IND-003",
            territoire_code: rattachementCode,
            code_insee: "44",
            maille: "DEPT",
            zone_id: "zone-500",
            jalon: jalon,
            taux_avancement: null,
          },
          {
            id: "IND-004",
            territoire_code: rattachementCode,
            code_insee: "44",
            maille: "DEPT",
            zone_id: "zone-500",
            jalon: jalon,
            taux_avancement: 70.0,
          },
          {
            id: "IND-005",
            territoire_code: "DEPT-33",
            code_insee: "33",
            maille: "DEPT",
            zone_id: "zone-501",
            jalon: jalon,
            taux_avancement: 75.0,
          },
        ],
      });

      await prisma.indicateur_evaluation.createMany({
        data: [
          {
            id: "IND-001",
            chantier_id: "CH-500",
            territoire_code: rattachementCode,
            code_insee: "44",
            maille: "DEPT",
            zone_id: "zone-500",
            taux_avancement: 80.2,
            ponderation_declaree: 33,
            ponderation_reelle: 33,
            date_calcul: new Date("2025-03-10"),
            jalon: jalon,
          },
          {
            id: "IND-002",
            chantier_id: "CH-500",
            territoire_code: rattachementCode,
            code_insee: "44",
            maille: "DEPT",
            zone_id: "zone-500",
            taux_avancement: 88.5,
            ponderation_declaree: 33,
            ponderation_reelle: 33,
            date_calcul: new Date("2025-03-10"),
            jalon: jalon,
          },
          {
            id: "IND-003",
            chantier_id: "CH-500",
            territoire_code: rattachementCode,
            code_insee: "44",
            maille: "DEPT",
            zone_id: "zone-500",
            taux_avancement: null,
            ponderation_declaree: 34,
            ponderation_reelle: 34,
            date_calcul: new Date("2025-03-10"),
            jalon: jalon,
          },
          {
            id: "IND-004",
            chantier_id: "CH-501",
            territoire_code: rattachementCode,
            code_insee: "44",
            maille: "DEPT",
            zone_id: "zone-500",
            taux_avancement: 68.0,
            ponderation_declaree: 1,
            ponderation_reelle: 1.0,
            date_calcul: new Date("2025-03-10"),
            jalon: jalon,
          },
          {
            id: "IND-005",
            chantier_id: "CH-500",
            territoire_code: "DEPT-33",
            code_insee: "33",
            maille: "DEPT",
            zone_id: "zone-501",
            taux_avancement: 70.0,
            ponderation_declaree: 1,
            ponderation_reelle: 1,
            date_calcul: new Date("2025-03-10"),
            jalon: jalon,
          },
          {
            id: "IND-001",
            chantier_id: "CH-500",
            territoire_code: rattachementCode,
            code_insee: "44",
            maille: "DEPT",
            zone_id: "zone-500",
            taux_avancement: 45.0,
            ponderation_declaree: 33,
            ponderation_reelle: 33,
            date_calcul: new Date("2025-02-01"),
            jalon: jalon,
          },
        ],
      });

      // When
      const result = await query.run({ rattachementCode, jalon });

      // Then
      expect(result).toEqual([
        {
          id: "CH-500",
          nom: "Chantier avec Indicateurs",
          iconeMinistere: "icone-ministere-5.svg",
          tauxAvancement: 72.8,
          tauxAvancementPilote: 78.5,
          indicateurs: [
            {
              id: "IND-001",
              nom: "Indicateur Alpha",
              tauxAvancement: 80.2,
              tauxAvancementPilote: 85.0,
              ponderation: 33,
            },
            {
              id: "IND-002",
              nom: "Indicateur Beta",
              tauxAvancement: 88.5,
              tauxAvancementPilote: 92.5,
              ponderation: 33,
            },
            {
              id: "IND-003",
              nom: "Indicateur Gamma",
              tauxAvancement: null,
              tauxAvancementPilote: null,
              ponderation: 34,
            },
          ],
        },
        {
          id: "CH-501",
          nom: "Autre Chantier",
          iconeMinistere: "icone-ministere-5.svg",
          tauxAvancement: 50.0,
          tauxAvancementPilote: 55.0,
          indicateurs: [
            {
              id: "IND-004",
              nom: "Indicateur Autre Chantier",
              tauxAvancement: 68.0,
              tauxAvancementPilote: 70.0,
              ponderation: 1,
            },
          ],
        },
      ]);
    });

    it("ne doit pas retourner les chantiers avec un taux d'avancement null", async () => {
      // Given
      const rattachementCode = "REG-93";
      const jalon = 2025;

      await prisma.ministere.create({
        data: {
          id: "MIN-600",
          acronyme: "MIN6",
          nom: "Ministère 6",
          icone: "icone-ministere-6.svg",
        },
      });

      await prisma.chantier_identite.createMany({
        data: [
          {
            id: "CH-600",
            nom: "Chantier avec taux null",
            ministeres: ["MIN-600"],
          },
          {
            id: "CH-601",
            nom: "Chantier avec taux valide",
            ministeres: ["MIN-600"],
          },
        ],
      });

      await prisma.referentiel_rattachement_groupe.create({
        data: {
          code: rattachementCode,
          libelle: "Groupe Région 93",
          ordre: 1,
        },
      });

      await prisma.referentiel_rattachement.create({
        data: {
          code: rattachementCode,
          groupe: rattachementCode,
          ordre: 1,
          libelle: "Région 93",
        },
      });

      await prisma.fiche_evaluation.create({
        data: {
          id: "c3d4e5f6-a7b8-4901-c234-56789abcdef0",
          rattachement_code: rattachementCode,
          jalon: jalon,
          etape_courante: "AUTO_EVALUATION",
        },
      });

      await prisma.chantier_territoire.createMany({
        data: [
          {
            id: "CH-600",
            territoire_code: rattachementCode,
            code_insee: "93",
            maille: "REG",
            zone_id: "zone-600",
          },
          {
            id: "CH-601",
            territoire_code: rattachementCode,
            code_insee: "93",
            maille: "REG",
            zone_id: "zone-600",
          },
        ],
      });

      await prisma.chantier_territoire_jalon.createMany({
        data: [
          {
            id: "CH-600",
            territoire_code: rattachementCode,
            code_insee: "93",
            maille: "REG",
            zone_id: "zone-600",
            jalon: jalon,
            taux_avancement: 75.0,
          },
          {
            id: "CH-601",
            territoire_code: rattachementCode,
            code_insee: "93",
            maille: "REG",
            zone_id: "zone-600",
            jalon: jalon,
            taux_avancement: 80.0,
          },
        ],
      });

      await prisma.chantier_evaluation.createMany({
        data: [
          {
            id: "CH-600",
            territoire_code: rattachementCode,
            code_insee: "93",
            maille: "REG",
            zone_id: "zone-600",
            taux_avancement: null,
            date_calcul: new Date("2025-03-15"),
            jalon: jalon,
          },
          {
            id: "CH-601",
            territoire_code: rattachementCode,
            code_insee: "93",
            maille: "REG",
            zone_id: "zone-600",
            taux_avancement: 78.5,
            date_calcul: new Date("2025-03-15"),
            jalon: jalon,
          },
        ],
      });

      // When
      const result = await query.run({ rattachementCode, jalon });

      // Then
      expect(result).toEqual([
        {
          id: "CH-601",
          nom: "Chantier avec taux valide",
          iconeMinistere: "icone-ministere-6.svg",
          tauxAvancement: 78.5,
          tauxAvancementPilote: 80.0,
          indicateurs: [],
        },
      ]);
    });
  });
});
