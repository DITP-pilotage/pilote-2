import { RecupererDetailsNoteCollectiveQuery } from "@/server/evaluation/queries/RecupererDetailsNoteCollectiveQuery";
import { PrismaPilote } from "@/server/db/PrismaPilote";
import { createIntegrationTest } from "@/server/infrastructure/test/createIntegrationTest";
import { fixtures as f } from "@/server/infrastructure/test/fixtures";
import { getPrisma } from "@/server/db/PrismaTransaction";

describe("RecupererDetailsNoteCollectiveQuery", () => {
  let query: RecupererDetailsNoteCollectiveQuery;
  const prismaPilote = new PrismaPilote();

  beforeEach(() => {
    query = new RecupererDetailsNoteCollectiveQuery({ prisma: prismaPilote });
  });

  describe("run", () => {
    it(
      "doit retourner les chantiers évaluation pour un rattachement et jalon donnés",
      createIntegrationTest(async () => {
        // Given
        const prisma = getPrisma();
        const jalon = 2025;

        const rattachement = await f.rattachement({
          code: "DEPT-75",
          libelle: "Département 75",
        });
        const rattachementCode = rattachement.code;

        const autreRattachement = await f.rattachement({
          code: "DEPT-01",
          libelle: "Département 01",
        });

        await f.fiche({
          rattachement_code: rattachementCode,
          jalon: jalon,
        });

        await f.fiche({
          rattachement_code: autreRattachement.code,
          jalon: jalon,
        });

        await f.fiche({
          rattachement_code: autreRattachement.code,
          jalon: 2024,
        });

        const ministere1 = await prisma.ministere.create({
          data: {
            id: "MIN-001",
            acronyme: "MIN1",
            nom: "Ministère 1",
            icone: "icone-ministere-1.svg",
          },
        });

        const ministere2 = await prisma.ministere.create({
          data: {
            id: "MIN-002",
            acronyme: "MIN2",
            nom: "Ministère 2",
            icone: "icone-ministere-2.svg",
          },
        });

        const chantier1 = await prisma.chantier_identite.create({
          data: {
            id: "CH-101",
            nom: "Chantier Alpha",
            ministeres: [ministere1.id],
          },
        });

        const chantier2 = await prisma.chantier_identite.create({
          data: {
            id: "CH-102",
            nom: "Chantier Beta",
            ministeres: [ministere2.id],
          },
        });

        const chantier3 = await prisma.chantier_identite.create({
          data: {
            id: "CH-103",
            nom: "Chantier Gamma",
            ministeres: [ministere1.id],
          },
        });

        await prisma.chantier_territoire.createMany({
          data: [
            {
              id: chantier1.id,
              territoire_code: rattachementCode,
              code_insee: "75",
              maille: "DEPT",
              zone_id: "zone-1",
            },
            {
              id: chantier1.id,
              territoire_code: autreRattachement.code,
              code_insee: "01",
              maille: "DEPT",
              zone_id: "zone-1",
            },
            {
              id: chantier2.id,
              territoire_code: rattachementCode,
              code_insee: "75",
              maille: "DEPT",
              zone_id: "zone-1",
            },
            {
              id: chantier2.id,
              territoire_code: autreRattachement.code,
              code_insee: "01",
              maille: "DEPT",
              zone_id: "zone-1",
            },
            {
              id: chantier3.id,
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
              id: chantier1.id,
              territoire_code: rattachementCode,
              code_insee: "75",
              maille: "DEPT",
              zone_id: "zone-1",
              jalon: jalon,
              taux_avancement: 80.0,
            },
            {
              id: chantier1.id,
              territoire_code: autreRattachement.code,
              code_insee: "01",
              maille: "DEPT",
              zone_id: "zone-1",
              jalon: jalon,
              taux_avancement: 95.0,
            },
            {
              id: chantier2.id,
              territoire_code: rattachementCode,
              code_insee: "75",
              maille: "DEPT",
              zone_id: "zone-1",
              jalon: jalon,
              taux_avancement: 85.0,
            },
            {
              id: chantier2.id,
              territoire_code: autreRattachement.code,
              code_insee: "01",
              maille: "DEPT",
              zone_id: "zone-1",
              jalon: 2024,
              taux_avancement: 90.0,
            },
            {
              id: chantier3.id,
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
              id: chantier1.id,
              territoire_code: rattachementCode,
              code_insee: "75",
              maille: "DEPT",
              zone_id: "zone-1",
              taux_avancement: 75.5,
              date_calcul: new Date("2025-02-15"),
              jalon: jalon,
            },
            {
              id: chantier1.id,
              territoire_code: autreRattachement.code,
              code_insee: "01",
              maille: "DEPT",
              zone_id: "zone-1",
              taux_avancement: 100,
              date_calcul: new Date("2025-02-15"),
              jalon: jalon,
            },
            {
              id: chantier2.id,
              territoire_code: rattachementCode,
              code_insee: "75",
              maille: "DEPT",
              zone_id: "zone-1",
              taux_avancement: 82.3,
              date_calcul: new Date("2025-02-15"),
              jalon: jalon,
            },
            {
              id: chantier2.id,
              territoire_code: autreRattachement.code,
              code_insee: "01",
              maille: "DEPT",
              zone_id: "zone-1",
              taux_avancement: 100,
              date_calcul: new Date("2025-02-15"),
              jalon: 2024,
            },
            {
              id: chantier3.id,
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
            id: chantier1.id,
            nom: chantier1.nom,
            iconeMinistere: ministere1.icone,
            tauxAvancement: 75.5,
            tauxAvancementPilote: 80.0,
            indicateurs: [],
          },
          {
            id: chantier2.id,
            nom: chantier2.nom,
            iconeMinistere: ministere2.icone,
            tauxAvancement: 82.3,
            tauxAvancementPilote: 85.0,
            indicateurs: [],
          },
          {
            id: chantier3.id,
            nom: chantier3.nom,
            iconeMinistere: ministere1.icone,
            tauxAvancement: 90,
            tauxAvancementPilote: 92.0,
            indicateurs: [],
          },
        ]);
      }),
    );

    it(
      "ne doit retourner que les chantiers de la dernière date_calcul",
      createIntegrationTest(async () => {
        // Given
        const prisma = getPrisma();
        const jalon = 2025;

        const rattachement = await f.rattachement({
          code: "REG-84",
          libelle: "Région 84",
        });
        const rattachementCode = rattachement.code;

        await f.fiche({
          rattachement_code: rattachementCode,
          jalon: jalon,
        });

        const ministere = await prisma.ministere.create({
          data: {
            id: "MIN-003",
            acronyme: "MIN3",
            nom: "Ministère 3",
            icone: "icone-ministere-3.svg",
          },
        });

        const chantier1 = await prisma.chantier_identite.create({
          data: {
            id: "CH-201",
            nom: "Chantier Delta",
            ministeres: [ministere.id],
          },
        });

        const chantier2 = await prisma.chantier_identite.create({
          data: {
            id: "CH-202",
            nom: "Chantier Epsilon",
            ministeres: [ministere.id],
          },
        });

        await prisma.chantier_territoire.createMany({
          data: [
            {
              id: chantier1.id,
              territoire_code: rattachementCode,
              code_insee: "84",
              maille: "REG",
              zone_id: "zone-2",
            },
            {
              id: chantier2.id,
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
              id: chantier1.id,
              territoire_code: rattachementCode,
              code_insee: "84",
              maille: "REG",
              zone_id: "zone-2",
              jalon: jalon,
              taux_avancement: 68.0,
            },
            {
              id: chantier2.id,
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
              id: chantier1.id,
              territoire_code: rattachementCode,
              code_insee: "84",
              maille: "REG",
              zone_id: "zone-2",
              taux_avancement: 40,
              date_calcul: new Date("2025-01-10"),
              jalon: jalon,
            },
            {
              id: chantier2.id,
              territoire_code: rattachementCode,
              code_insee: "84",
              maille: "REG",
              zone_id: "zone-2",
              taux_avancement: 45,
              date_calcul: new Date("2025-01-10"),
              jalon: jalon,
            },
            {
              id: chantier1.id,
              territoire_code: rattachementCode,
              code_insee: "84",
              maille: "REG",
              zone_id: "zone-2",
              taux_avancement: 65,
              date_calcul: new Date("2025-02-20"),
              jalon: jalon,
            },
            {
              id: chantier2.id,
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
            id: chantier1.id,
            nom: chantier1.nom,
            iconeMinistere: ministere.icone,
            tauxAvancement: 65,
            tauxAvancementPilote: 68.0,
            indicateurs: [],
          },
          {
            id: chantier2.id,
            nom: chantier2.nom,
            iconeMinistere: ministere.icone,
            tauxAvancement: 70,
            tauxAvancementPilote: 73.0,
            indicateurs: [],
          },
        ]);
      }),
    );

    it(
      "doit retourner une liste vide si aucun chantier pour le rattachement",
      createIntegrationTest(async () => {
        // Given
        const rattachement = await f.rattachement();
        const rattachementCodeInexistant = rattachement.code;
        const jalon = 2025;

        // When
        const result = await query.run({
          rattachementCode: rattachementCodeInexistant,
          jalon,
        });

        // Then
        expect(result).toEqual([]);
      }),
    );

    it(
      "doit gérer correctement les chantiers sans ministère",
      createIntegrationTest(async () => {
        // Given
        const prisma = getPrisma();
        const jalon = 2025;

        const rattachement = await f.rattachement({
          code: "REG-84",
          libelle: "Région 84",
        });
        const rattachementCode = rattachement.code;

        await f.fiche({
          rattachement_code: rattachementCode,
          jalon: jalon,
        });

        const chantier = await prisma.chantier_identite.create({
          data: {
            id: "CH-401",
            nom: "Chantier Sans Ministère",
            ministeres: [],
          },
        });

        await prisma.chantier_territoire.create({
          data: {
            id: chantier.id,
            territoire_code: rattachementCode,
            code_insee: "84",
            maille: "REG",
            zone_id: "zone-4",
          },
        });

        await prisma.chantier_territoire_jalon.create({
          data: {
            id: chantier.id,
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
            id: chantier.id,
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
            id: chantier.id,
            nom: chantier.nom,
            iconeMinistere: null,
            tauxAvancement: 88,
            tauxAvancementPilote: 91.0,
            indicateurs: [],
          },
        ]);
      }),
    );

    it(
      "doit remonter les indicateurs liés au chantier evaluation",
      createIntegrationTest(async () => {
        // Given
        const prisma = getPrisma();
        const jalon = 2025;

        const rattachement = await f.rattachement({
          code: "DEPT-44",
          libelle: "Département 44",
        });
        const rattachementCode = rattachement.code;

        const autreRattachement = await f.rattachement({
          code: "DEPT-33",
          libelle: "Département 33",
        });

        await f.fiche({
          rattachement_code: rattachementCode,
          jalon: jalon,
        });

        await f.fiche({
          rattachement_code: autreRattachement.code,
          jalon: jalon,
        });

        const ministere = await prisma.ministere.create({
          data: {
            id: "MIN-500",
            acronyme: "MIN5",
            nom: "Ministère 5",
            icone: "icone-ministere-5.svg",
          },
        });

        const chantier1 = await prisma.chantier_identite.create({
          data: {
            id: "CH-500",
            nom: "Chantier avec Indicateurs",
            ministeres: [ministere.id],
          },
        });

        const chantier2 = await prisma.chantier_identite.create({
          data: {
            id: "CH-501",
            nom: "Autre Chantier",
            ministeres: [ministere.id],
          },
        });

        const indicateur1 = await prisma.indicateur_identite.create({
          data: {
            id: "IND-001",
            nom: "Indicateur Alpha",
            chantier_id: chantier1.id,
          },
        });

        const indicateur2 = await prisma.indicateur_identite.create({
          data: {
            id: "IND-002",
            nom: "Indicateur Beta",
            chantier_id: chantier1.id,
          },
        });

        const indicateur3 = await prisma.indicateur_identite.create({
          data: {
            id: "IND-003",
            nom: "Indicateur Gamma",
            chantier_id: chantier1.id,
          },
        });

        const indicateur4 = await prisma.indicateur_identite.create({
          data: {
            id: "IND-004",
            nom: "Indicateur Autre Chantier",
            chantier_id: chantier2.id,
          },
        });

        const indicateur5 = await prisma.indicateur_identite.create({
          data: {
            id: "IND-005",
            nom: "Indicateur Autre Territoire",
            chantier_id: chantier1.id,
          },
        });

        await prisma.chantier_territoire.createMany({
          data: [
            {
              id: chantier1.id,
              territoire_code: rattachementCode,
              code_insee: "44",
              maille: "DEPT",
              zone_id: "zone-500",
            },
            {
              id: chantier2.id,
              territoire_code: rattachementCode,
              code_insee: "44",
              maille: "DEPT",
              zone_id: "zone-500",
            },
            {
              id: chantier1.id,
              territoire_code: autreRattachement.code,
              code_insee: "33",
              maille: "DEPT",
              zone_id: "zone-501",
            },
          ],
        });

        await prisma.chantier_territoire_jalon.createMany({
          data: [
            {
              id: chantier1.id,
              territoire_code: rattachementCode,
              code_insee: "44",
              maille: "DEPT",
              zone_id: "zone-500",
              jalon: jalon,
              taux_avancement: 78.5,
            },
            {
              id: chantier2.id,
              territoire_code: rattachementCode,
              code_insee: "44",
              maille: "DEPT",
              zone_id: "zone-500",
              jalon: jalon,
              taux_avancement: 55.0,
            },
            {
              id: chantier1.id,
              territoire_code: autreRattachement.code,
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
              id: chantier1.id,
              territoire_code: rattachementCode,
              code_insee: "44",
              maille: "DEPT",
              zone_id: "zone-500",
              taux_avancement: 72.8,
              date_calcul: new Date("2025-03-10"),
              jalon: jalon,
            },
            {
              id: chantier1.id,
              territoire_code: rattachementCode,
              code_insee: "44",
              maille: "DEPT",
              zone_id: "zone-500",
              taux_avancement: 72.8,
              date_calcul: new Date("2025-02-01"),
              jalon: jalon,
            },
            {
              id: chantier2.id,
              territoire_code: rattachementCode,
              code_insee: "44",
              maille: "DEPT",
              zone_id: "zone-500",
              taux_avancement: 50.0,
              date_calcul: new Date("2025-03-10"),
              jalon: jalon,
            },
            {
              id: chantier1.id,
              territoire_code: autreRattachement.code,
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
              id: indicateur1.id,
              chantier_id: chantier1.id,
              territoire_code: rattachementCode,
              code_insee: "44",
              maille: "DEPT",
              zone_id: "zone-500",
            },
            {
              id: indicateur2.id,
              chantier_id: chantier1.id,
              territoire_code: rattachementCode,
              code_insee: "44",
              maille: "DEPT",
              zone_id: "zone-500",
            },
            {
              id: indicateur3.id,
              chantier_id: chantier1.id,
              territoire_code: rattachementCode,
              code_insee: "44",
              maille: "DEPT",
              zone_id: "zone-500",
            },
            {
              id: indicateur4.id,
              chantier_id: chantier2.id,
              territoire_code: rattachementCode,
              code_insee: "44",
              maille: "DEPT",
              zone_id: "zone-500",
            },
            {
              id: indicateur5.id,
              chantier_id: chantier1.id,
              territoire_code: autreRattachement.code,
              code_insee: "33",
              maille: "DEPT",
              zone_id: "zone-501",
            },
          ],
        });

        await prisma.indicateur_territoire_jalon.createMany({
          data: [
            {
              id: indicateur1.id,
              territoire_code: rattachementCode,
              code_insee: "44",
              maille: "DEPT",
              zone_id: "zone-500",
              jalon: jalon,
              taux_avancement: 85.0,
            },
            {
              id: indicateur2.id,
              territoire_code: rattachementCode,
              code_insee: "44",
              maille: "DEPT",
              zone_id: "zone-500",
              jalon: jalon,
              taux_avancement: 92.5,
            },
            {
              id: indicateur3.id,
              territoire_code: rattachementCode,
              code_insee: "44",
              maille: "DEPT",
              zone_id: "zone-500",
              jalon: jalon,
              taux_avancement: null,
            },
            {
              id: indicateur4.id,
              territoire_code: rattachementCode,
              code_insee: "44",
              maille: "DEPT",
              zone_id: "zone-500",
              jalon: jalon,
              taux_avancement: 70.0,
            },
            {
              id: indicateur5.id,
              territoire_code: autreRattachement.code,
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
              id: indicateur1.id,
              chantier_id: chantier1.id,
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
              id: indicateur2.id,
              chantier_id: chantier1.id,
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
              id: indicateur3.id,
              chantier_id: chantier1.id,
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
              id: indicateur4.id,
              chantier_id: chantier2.id,
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
              id: indicateur5.id,
              chantier_id: chantier1.id,
              territoire_code: autreRattachement.code,
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
              id: indicateur1.id,
              chantier_id: chantier1.id,
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
            id: chantier1.id,
            nom: chantier1.nom,
            iconeMinistere: ministere.icone,
            tauxAvancement: 72.8,
            tauxAvancementPilote: 78.5,
            indicateurs: [
              {
                id: indicateur1.id,
                nom: indicateur1.nom,
                tauxAvancement: 80.2,
                tauxAvancementPilote: 85.0,
                ponderation: 33,
              },
              {
                id: indicateur2.id,
                nom: indicateur2.nom,
                tauxAvancement: 88.5,
                tauxAvancementPilote: 92.5,
                ponderation: 33,
              },
              {
                id: indicateur3.id,
                nom: indicateur3.nom,
                tauxAvancement: null,
                tauxAvancementPilote: null,
                ponderation: 34,
              },
            ],
          },
          {
            id: chantier2.id,
            nom: chantier2.nom,
            iconeMinistere: ministere.icone,
            tauxAvancement: 50.0,
            tauxAvancementPilote: 55.0,
            indicateurs: [
              {
                id: indicateur4.id,
                nom: indicateur4.nom,
                tauxAvancement: 68.0,
                tauxAvancementPilote: 70.0,
                ponderation: 1,
              },
            ],
          },
        ]);
      }),
    );

    it(
      "ne doit pas retourner les chantiers avec un taux d'avancement null",
      createIntegrationTest(async () => {
        // Given
        const prisma = getPrisma();
        const jalon = 2025;

        const rattachement = await f.rattachement({
          code: "REG-93",
          libelle: "Région 93",
        });
        const rattachementCode = rattachement.code;

        await f.fiche({
          rattachement_code: rattachementCode,
          jalon: jalon,
        });

        const ministere = await prisma.ministere.create({
          data: {
            id: "MIN-600",
            acronyme: "MIN6",
            nom: "Ministère 6",
            icone: "icone-ministere-6.svg",
          },
        });

        const chantierNull = await prisma.chantier_identite.create({
          data: {
            id: "CH-600",
            nom: "Chantier avec taux null",
            ministeres: [ministere.id],
          },
        });

        const chantierValide = await prisma.chantier_identite.create({
          data: {
            id: "CH-601",
            nom: "Chantier avec taux valide",
            ministeres: [ministere.id],
          },
        });

        await prisma.chantier_territoire.createMany({
          data: [
            {
              id: chantierNull.id,
              territoire_code: rattachementCode,
              code_insee: "93",
              maille: "REG",
              zone_id: "zone-600",
            },
            {
              id: chantierValide.id,
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
              id: chantierNull.id,
              territoire_code: rattachementCode,
              code_insee: "93",
              maille: "REG",
              zone_id: "zone-600",
              jalon: jalon,
              taux_avancement: 75.0,
            },
            {
              id: chantierValide.id,
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
              id: chantierNull.id,
              territoire_code: rattachementCode,
              code_insee: "93",
              maille: "REG",
              zone_id: "zone-600",
              taux_avancement: null,
              date_calcul: new Date("2025-03-15"),
              jalon: jalon,
            },
            {
              id: chantierValide.id,
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
            id: chantierValide.id,
            nom: chantierValide.nom,
            iconeMinistere: ministere.icone,
            tauxAvancement: 78.5,
            tauxAvancementPilote: 80.0,
            indicateurs: [],
          },
        ]);
      }),
    );
  });
});
