import { createIntegrationTest } from "@/server/infrastructure/test/createIntegrationTest";
import { fixtures } from "@/server/infrastructure/test/fixtures";
import { getPrisma } from "@/server/db/PrismaTransaction";
import { PrismaPilote } from "@/server/db/PrismaPilote";
import { ChantiersSignalesDataFetcher } from "@/server/chantiers/infrastructure/queries/ChantiersSignalesDataFetcher";

describe("ChantiersSignalesDataFetcher", () => {
  let dataFetcher: ChantiersSignalesDataFetcher;

  beforeEach(() => {
    dataFetcher = new ChantiersSignalesDataFetcher({
      prisma: new PrismaPilote(),
    });
  });

  describe("recupererChantierTerritoires", () => {
    it(
      "exclut les chantiers dont la liste de ministères est vide",
      createIntegrationTest(async () => {
        // Given
        await fixtures.chantierIdentite({
          id: "CH-001",
          ministeres: ["MIN-01"],
        });
        await fixtures.chantierIdentite({ id: "CH-002", ministeres: [] });
        await fixtures.chantierTerritoire({
          id: "CH-001",
          territoire_code: "REG-11",
          code_insee: "11",
          maille: "REG",
          est_applicable: true,
        });
        await fixtures.chantierTerritoire({
          id: "CH-002",
          territoire_code: "REG-11",
          code_insee: "11",
          maille: "REG",
          est_applicable: true,
        });

        // When
        const résultat = await dataFetcher.recupererChantierTerritoires({
          chantierIds: ["CH-001", "CH-002"],
          territoireCode: "REG-11",
          jalon: 2025,
        });

        // Then
        expect(résultat.map((ct) => ct.id)).toEqual(["CH-001"]);
      }),
    );

    it(
      "exclut les chantiers territoire non applicables",
      createIntegrationTest(async () => {
        // Given
        await fixtures.chantierIdentite({
          id: "CH-001",
          ministeres: ["MIN-01"],
        });
        await fixtures.chantierTerritoire({
          id: "CH-001",
          territoire_code: "REG-11",
          code_insee: "11",
          maille: "REG",
          est_applicable: false,
        });

        // When
        const résultat = await dataFetcher.recupererChantierTerritoires({
          chantierIds: ["CH-001"],
          territoireCode: "REG-11",
          jalon: 2025,
        });

        // Then
        expect(résultat).toEqual([]);
      }),
    );

    it(
      "restreint aux chantierIds demandés",
      createIntegrationTest(async () => {
        // Given
        await fixtures.chantierIdentite({
          id: "CH-001",
          ministeres: ["MIN-01"],
        });
        await fixtures.chantierIdentite({
          id: "CH-002",
          ministeres: ["MIN-01"],
        });
        await fixtures.chantierTerritoire({
          id: "CH-001",
          territoire_code: "REG-11",
          code_insee: "11",
          maille: "REG",
          est_applicable: true,
        });
        await fixtures.chantierTerritoire({
          id: "CH-002",
          territoire_code: "REG-11",
          code_insee: "11",
          maille: "REG",
          est_applicable: true,
        });

        // When
        const résultat = await dataFetcher.recupererChantierTerritoires({
          chantierIds: ["CH-001"],
          territoireCode: "REG-11",
          jalon: 2025,
        });

        // Then
        expect(résultat.map((ct) => ct.id)).toEqual(["CH-001"]);
      }),
    );

    it(
      "avec statutPublieUniquement, exclut les chantiers non publiés",
      createIntegrationTest(async () => {
        // Given
        await fixtures.chantierIdentite({
          id: "CH-001",
          ministeres: ["MIN-01"],
          statut: "PUBLIE",
        });
        await fixtures.chantierIdentite({
          id: "CH-002",
          ministeres: ["MIN-01"],
          statut: "BROUILLON",
        });
        await fixtures.chantierTerritoire({
          id: "CH-001",
          territoire_code: "REG-11",
          code_insee: "11",
          maille: "REG",
          est_applicable: true,
        });
        await fixtures.chantierTerritoire({
          id: "CH-002",
          territoire_code: "REG-11",
          code_insee: "11",
          maille: "REG",
          est_applicable: true,
        });

        // When
        const résultat = await dataFetcher.recupererChantierTerritoires({
          chantierIds: ["CH-001", "CH-002"],
          territoireCode: "REG-11",
          jalon: 2025,
          statutPublieUniquement: true,
        });

        // Then
        expect(résultat.map((ct) => ct.id)).toEqual(["CH-001"]);
      }),
    );

    it(
      "sans statutPublieUniquement, inclut les chantiers non publiés",
      createIntegrationTest(async () => {
        // Given
        await fixtures.chantierIdentite({
          id: "CH-001",
          ministeres: ["MIN-01"],
          statut: "BROUILLON",
        });
        await fixtures.chantierTerritoire({
          id: "CH-001",
          territoire_code: "REG-11",
          code_insee: "11",
          maille: "REG",
          est_applicable: true,
        });

        // When
        const résultat = await dataFetcher.recupererChantierTerritoires({
          chantierIds: ["CH-001"],
          territoireCode: "REG-11",
          jalon: 2025,
        });

        // Then
        expect(résultat.map((ct) => ct.id)).toEqual(["CH-001"]);
      }),
    );

    it(
      "ne remonte les données de chantier_territoire_jalon que pour le jalon demandé",
      createIntegrationTest(async () => {
        // Given
        await fixtures.chantierIdentite({
          id: "CH-001",
          ministeres: ["MIN-01"],
        });
        await fixtures.chantierTerritoire({
          id: "CH-001",
          territoire_code: "REG-11",
          code_insee: "11",
          maille: "REG",
          est_applicable: true,
        });
        await fixtures.chantierTerritoireJalon({
          id: "CH-001",
          territoire_code: "REG-11",
          code_insee: "11",
          maille: "REG",
          jalon: 2024,
          ecart: -50,
        });
        await fixtures.chantierTerritoireJalon({
          id: "CH-001",
          territoire_code: "REG-11",
          code_insee: "11",
          maille: "REG",
          jalon: 2025,
          ecart: -15,
        });

        // When
        const résultat = await dataFetcher.recupererChantierTerritoires({
          chantierIds: ["CH-001"],
          territoireCode: "REG-11",
          jalon: 2025,
        });

        // Then
        expect(résultat).toEqual([
          expect.objectContaining({
            id: "CH-001",
            chantier_territoire_jalon: [{ ecart: -15, taux_avancement: null }],
          }),
        ]);
      }),
    );
  });

  describe("recupererPvaIds", () => {
    it(
      "au national, compte les PVA depuis les territoires enfants REG et DEPT",
      createIntegrationTest(async () => {
        // Given
        await fixtures.chantierIdentite({
          id: "CH-001",
          ministeres: ["MIN-01"],
        });
        await fixtures.chantierTerritoire({
          id: "CH-001",
          territoire_code: "REG-11",
          code_insee: "11",
          maille: "REG",
          est_applicable: true,
          nombre_propositions_valeur_actuelle: 2,
        });
        await fixtures.chantierIdentite({
          id: "CH-002",
          ministeres: ["MIN-01"],
        });
        await fixtures.chantierTerritoire({
          id: "CH-002",
          territoire_code: "DEPT-75",
          code_insee: "75",
          maille: "DEPT",
          est_applicable: true,
          nombre_propositions_valeur_actuelle: 0,
        });

        // When
        const résultat = await dataFetcher.recupererPvaIds(
          "NAT",
          ["CH-001", "CH-002"],
          "NAT-FR",
        );

        // Then
        expect(résultat).toEqual(new Set(["CH-001"]));
      }),
    );

    it(
      "au régional, compte les PVA depuis le territoire lui-même et ses territoires enfants",
      createIntegrationTest(async () => {
        // Given
        const prisma = getPrisma();
        await prisma.territoire.upsert({
          where: { code: "REG-76" },
          update: {},
          create: {
            code: "REG-76",
            nom: "Occitanie",
            nom_affiche: "Occitanie",
            maille: "REG",
            code_insee: "76",
            zone_id: "zone-reg",
          },
        });
        await prisma.territoire.upsert({
          where: { code: "DEPT-31" },
          update: { code_parent: "REG-76" },
          create: {
            code: "DEPT-31",
            nom: "Haute-Garonne",
            nom_affiche: "Haute-Garonne",
            maille: "DEPT",
            code_insee: "31",
            code_parent: "REG-76",
            zone_id: "zone-dept",
          },
        });

        await fixtures.chantierIdentite({
          id: "CH-001",
          ministeres: ["MIN-01"],
        });
        await fixtures.chantierTerritoire({
          id: "CH-001",
          territoire_code: "DEPT-31",
          code_insee: "31",
          maille: "DEPT",
          est_applicable: true,
          nombre_propositions_valeur_actuelle: 1,
        });

        // When
        const résultat = await dataFetcher.recupererPvaIds(
          "REG",
          ["CH-001"],
          "REG-76",
        );

        // Then
        expect(résultat).toEqual(new Set(["CH-001"]));
      }),
    );

    it(
      "au départemental, ne compte rien (le PVA départemental est lu directement sur le chantier territoire)",
      createIntegrationTest(async () => {
        // When
        const résultat = await dataFetcher.recupererPvaIds(
          "DEPT",
          ["CH-001"],
          "DEPT-75",
        );

        // Then
        expect(résultat).toEqual(new Set());
      }),
    );
  });

  describe("recupererAbsenceTauxDepartementalSets", () => {
    it(
      "hors national, retourne des sets vides",
      createIntegrationTest(async () => {
        // When
        const résultat =
          await dataFetcher.recupererAbsenceTauxDepartementalSets(
            "REG",
            [],
            2025,
          );

        // Then
        expect(résultat).toEqual({
          chantiersAvecDept: new Set(),
          chantiersAvecTaux: new Set(),
        });
      }),
    );

    it(
      "au national, ignore les chantiers dont la cible n'est pas attendue",
      createIntegrationTest(async () => {
        // Given
        await fixtures.chantierIdentite({
          id: "CH-001",
          ministeres: ["MIN-01"],
          cible_attendue: false,
        });
        await fixtures.chantierTerritoire({
          id: "CH-001",
          territoire_code: "DEPT-75",
          code_insee: "75",
          maille: "DEPT",
          est_applicable: true,
        });

        // When
        const résultat =
          await dataFetcher.recupererAbsenceTauxDepartementalSets(
            "NAT",
            [
              {
                id: "CH-001",
                meteo: null,
                tendance: null,
                nombre_propositions_valeur_actuelle: 0,
                maille: "NAT",
                chantier_identite: {
                  nom: "Chantier test",
                  cible_attendue: false,
                },
                chantier_territoire_jalon: [],
              },
            ],
            2025,
          );

        // Then
        expect(résultat).toEqual({
          chantiersAvecDept: new Set(),
          chantiersAvecTaux: new Set(),
        });
      }),
    );

    it(
      "au national, distingue les chantiers avec département applicable de ceux avec un taux renseigné",
      createIntegrationTest(async () => {
        // Given — CH-001 a un dept applicable sans taux, CH-002 a un dept applicable avec taux
        await fixtures.chantierIdentite({
          id: "CH-001",
          ministeres: ["MIN-01"],
          cible_attendue: true,
        });
        await fixtures.chantierTerritoire({
          id: "CH-001",
          territoire_code: "DEPT-75",
          code_insee: "75",
          maille: "DEPT",
          est_applicable: true,
        });
        await fixtures.chantierTerritoireJalon({
          id: "CH-001",
          territoire_code: "DEPT-75",
          code_insee: "75",
          maille: "DEPT",
          jalon: 2025,
          taux_avancement: null,
        });

        await fixtures.chantierIdentite({
          id: "CH-002",
          ministeres: ["MIN-01"],
          cible_attendue: true,
        });
        await fixtures.chantierTerritoire({
          id: "CH-002",
          territoire_code: "DEPT-75",
          code_insee: "75",
          maille: "DEPT",
          est_applicable: true,
        });
        await fixtures.chantierTerritoireJalon({
          id: "CH-002",
          territoire_code: "DEPT-75",
          code_insee: "75",
          maille: "DEPT",
          jalon: 2025,
          taux_avancement: 50,
        });

        const chantierTerritoiresNat = [
          {
            id: "CH-001",
            meteo: null,
            tendance: null,
            nombre_propositions_valeur_actuelle: 0,
            maille: "NAT",
            chantier_identite: { nom: "Chantier 1", cible_attendue: true },
            chantier_territoire_jalon: [],
          },
          {
            id: "CH-002",
            meteo: null,
            tendance: null,
            nombre_propositions_valeur_actuelle: 0,
            maille: "NAT",
            chantier_identite: { nom: "Chantier 2", cible_attendue: true },
            chantier_territoire_jalon: [],
          },
        ];

        // When
        const résultat =
          await dataFetcher.recupererAbsenceTauxDepartementalSets(
            "NAT",
            chantierTerritoiresNat,
            2025,
          );

        // Then
        expect(résultat).toEqual({
          chantiersAvecDept: new Set(["CH-001", "CH-002"]),
          chantiersAvecTaux: new Set(["CH-002"]),
        });
      }),
    );
  });
});
