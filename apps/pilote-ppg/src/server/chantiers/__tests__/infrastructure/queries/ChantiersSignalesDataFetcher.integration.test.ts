import { randomUUID } from "node:crypto";
import { createIntegrationTest } from "@/test/createIntegrationTest";
import { fixtures } from "@/test/fixtures";
import { getPrisma } from "@/server/framework/persistence/PrismaTransaction";
import { PrismaPilote } from "@/server/framework/persistence/PrismaPilote";
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
        const chantierAvecMinisteres = await fixtures.chantierIdentite({
          ministeres: ["MIN-01"],
        });
        const chantierSansMinisteres = await fixtures.chantierIdentite({
          ministeres: [],
        });
        await fixtures.chantierTerritoire({
          id: chantierAvecMinisteres.id,
          territoire_code: "REG-11",
          code_insee: "11",
          maille: "REG",
          est_applicable: true,
        });
        await fixtures.chantierTerritoire({
          id: chantierSansMinisteres.id,
          territoire_code: "REG-11",
          code_insee: "11",
          maille: "REG",
          est_applicable: true,
        });

        // When
        const résultat = await dataFetcher.recupererChantierTerritoires({
          chantierIds: [chantierAvecMinisteres.id, chantierSansMinisteres.id],
          territoireCode: "REG-11",
          jalon: 2025,
        });

        // Then
        expect(résultat.map((ct) => ct.id)).toEqual([
          chantierAvecMinisteres.id,
        ]);
      }),
    );

    it(
      "exclut les chantiers territoire non applicables",
      createIntegrationTest(async () => {
        // Given
        const chantier = await fixtures.chantierIdentite({
          ministeres: ["MIN-01"],
        });
        await fixtures.chantierTerritoire({
          id: chantier.id,
          territoire_code: "REG-11",
          code_insee: "11",
          maille: "REG",
          est_applicable: false,
        });

        // When
        const résultat = await dataFetcher.recupererChantierTerritoires({
          chantierIds: [chantier.id],
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
        const chantierDemande = await fixtures.chantierIdentite({
          ministeres: ["MIN-01"],
        });
        const chantierNonDemande = await fixtures.chantierIdentite({
          ministeres: ["MIN-01"],
        });
        await fixtures.chantierTerritoire({
          id: chantierDemande.id,
          territoire_code: "REG-11",
          code_insee: "11",
          maille: "REG",
          est_applicable: true,
        });
        await fixtures.chantierTerritoire({
          id: chantierNonDemande.id,
          territoire_code: "REG-11",
          code_insee: "11",
          maille: "REG",
          est_applicable: true,
        });

        // When
        const résultat = await dataFetcher.recupererChantierTerritoires({
          chantierIds: [chantierDemande.id],
          territoireCode: "REG-11",
          jalon: 2025,
        });

        // Then
        expect(résultat.map((ct) => ct.id)).toEqual([chantierDemande.id]);
      }),
    );

    it(
      "avec statutPublieUniquement, exclut les chantiers non publiés",
      createIntegrationTest(async () => {
        // Given
        const chantierPublie = await fixtures.chantierIdentite({
          ministeres: ["MIN-01"],
          statut: "PUBLIE",
        });
        const chantierBrouillon = await fixtures.chantierIdentite({
          ministeres: ["MIN-01"],
          statut: "BROUILLON",
        });
        await fixtures.chantierTerritoire({
          id: chantierPublie.id,
          territoire_code: "REG-11",
          code_insee: "11",
          maille: "REG",
          est_applicable: true,
        });
        await fixtures.chantierTerritoire({
          id: chantierBrouillon.id,
          territoire_code: "REG-11",
          code_insee: "11",
          maille: "REG",
          est_applicable: true,
        });

        // When
        const résultat = await dataFetcher.recupererChantierTerritoires({
          chantierIds: [chantierPublie.id, chantierBrouillon.id],
          territoireCode: "REG-11",
          jalon: 2025,
          statutPublieUniquement: true,
        });

        // Then
        expect(résultat.map((ct) => ct.id)).toEqual([chantierPublie.id]);
      }),
    );

    it(
      "sans statutPublieUniquement, inclut les chantiers non publiés",
      createIntegrationTest(async () => {
        // Given
        const chantier = await fixtures.chantierIdentite({
          ministeres: ["MIN-01"],
          statut: "BROUILLON",
        });
        await fixtures.chantierTerritoire({
          id: chantier.id,
          territoire_code: "REG-11",
          code_insee: "11",
          maille: "REG",
          est_applicable: true,
        });

        // When
        const résultat = await dataFetcher.recupererChantierTerritoires({
          chantierIds: [chantier.id],
          territoireCode: "REG-11",
          jalon: 2025,
        });

        // Then
        expect(résultat.map((ct) => ct.id)).toEqual([chantier.id]);
      }),
    );

    it(
      "ne remonte les données de chantier_territoire_jalon que pour le jalon demandé",
      createIntegrationTest(async () => {
        // Given
        const chantier = await fixtures.chantierIdentite({
          ministeres: ["MIN-01"],
        });
        await fixtures.chantierTerritoire({
          id: chantier.id,
          territoire_code: "REG-11",
          code_insee: "11",
          maille: "REG",
          est_applicable: true,
        });
        await fixtures.chantierTerritoireJalon({
          id: chantier.id,
          territoire_code: "REG-11",
          code_insee: "11",
          maille: "REG",
          jalon: 2024,
          ecart: -50,
        });
        await fixtures.chantierTerritoireJalon({
          id: chantier.id,
          territoire_code: "REG-11",
          code_insee: "11",
          maille: "REG",
          jalon: 2025,
          ecart: -15,
        });

        // When
        const résultat = await dataFetcher.recupererChantierTerritoires({
          chantierIds: [chantier.id],
          territoireCode: "REG-11",
          jalon: 2025,
        });

        // Then
        expect(résultat).toEqual([
          expect.objectContaining({
            id: chantier.id,
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
        const chantierAvecPva = await fixtures.chantierIdentite({
          ministeres: ["MIN-01"],
        });
        await fixtures.chantierTerritoire({
          id: chantierAvecPva.id,
          territoire_code: "REG-11",
          code_insee: "11",
          maille: "REG",
          est_applicable: true,
          nombre_propositions_valeur_actuelle: 2,
        });
        const chantierSansPva = await fixtures.chantierIdentite({
          ministeres: ["MIN-01"],
        });
        await fixtures.chantierTerritoire({
          id: chantierSansPva.id,
          territoire_code: "DEPT-75",
          code_insee: "75",
          maille: "DEPT",
          est_applicable: true,
          nombre_propositions_valeur_actuelle: 0,
        });

        // When
        const résultat = await dataFetcher.recupererPvaIds(
          "NAT",
          [chantierAvecPva.id, chantierSansPva.id],
          "NAT-FR",
        );

        // Then
        expect(résultat).toEqual(new Set([chantierAvecPva.id]));
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

        const chantier = await fixtures.chantierIdentite({
          ministeres: ["MIN-01"],
        });
        await fixtures.chantierTerritoire({
          id: chantier.id,
          territoire_code: "DEPT-31",
          code_insee: "31",
          maille: "DEPT",
          est_applicable: true,
          nombre_propositions_valeur_actuelle: 1,
        });

        // When
        const résultat = await dataFetcher.recupererPvaIds(
          "REG",
          [chantier.id],
          "REG-76",
        );

        // Then
        expect(résultat).toEqual(new Set([chantier.id]));
      }),
    );

    it(
      "au départemental, ne compte rien (le PVA départemental est lu directement sur le chantier territoire)",
      createIntegrationTest(async () => {
        // When
        const résultat = await dataFetcher.recupererPvaIds(
          "DEPT",
          [randomUUID()],
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
        const chantier = await fixtures.chantierIdentite({
          ministeres: ["MIN-01"],
          cible_attendue: false,
        });
        await fixtures.chantierTerritoire({
          id: chantier.id,
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
                id: chantier.id,
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
        // Given — chantierSansTaux a un dept applicable sans taux, chantierAvecTaux a un dept applicable avec taux
        const chantierSansTaux = await fixtures.chantierIdentite({
          ministeres: ["MIN-01"],
          cible_attendue: true,
        });
        await fixtures.chantierTerritoire({
          id: chantierSansTaux.id,
          territoire_code: "DEPT-75",
          code_insee: "75",
          maille: "DEPT",
          est_applicable: true,
        });
        await fixtures.chantierTerritoireJalon({
          id: chantierSansTaux.id,
          territoire_code: "DEPT-75",
          code_insee: "75",
          maille: "DEPT",
          jalon: 2025,
          taux_avancement: null,
        });

        const chantierAvecTaux = await fixtures.chantierIdentite({
          ministeres: ["MIN-01"],
          cible_attendue: true,
        });
        await fixtures.chantierTerritoire({
          id: chantierAvecTaux.id,
          territoire_code: "DEPT-75",
          code_insee: "75",
          maille: "DEPT",
          est_applicable: true,
        });
        await fixtures.chantierTerritoireJalon({
          id: chantierAvecTaux.id,
          territoire_code: "DEPT-75",
          code_insee: "75",
          maille: "DEPT",
          jalon: 2025,
          taux_avancement: 50,
        });

        const chantierTerritoiresNat = [
          {
            id: chantierSansTaux.id,
            meteo: null,
            tendance: null,
            nombre_propositions_valeur_actuelle: 0,
            maille: "NAT",
            chantier_identite: { nom: "Chantier 1", cible_attendue: true },
            chantier_territoire_jalon: [],
          },
          {
            id: chantierAvecTaux.id,
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
          chantiersAvecDept: new Set([
            chantierSansTaux.id,
            chantierAvecTaux.id,
          ]),
          chantiersAvecTaux: new Set([chantierAvecTaux.id]),
        });
      }),
    );
  });
});
