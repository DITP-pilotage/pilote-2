import { createIntegrationTest } from "@/test/createIntegrationTest";
import { fixtures } from "@/test/fixtures";
import { PrismaPilote } from "@/server/framework/persistence/PrismaPilote";
import { GetTerritoiresNonAJourQuery } from "@/server/chantiers/infrastructure/queries/GetTerritoiresNonAJourQuery";
import { GetIndicateursNonAJourQuery } from "@/server/chantiers/infrastructure/queries/GetIndicateursNonAJourQuery";

type TerritoireTest = {
  territoire_code: string;
  code_insee: string;
  maille: "NAT" | "DEPT";
  zone_id: string;
  territoire_nom: string;
};

const FRANCE: TerritoireTest = {
  territoire_code: "NAT-FR",
  code_insee: "FR",
  maille: "NAT",
  zone_id: "FRANCE",
  territoire_nom: "France",
};
const FINISTERE: TerritoireTest = {
  territoire_code: "DEPT-29",
  code_insee: "29",
  maille: "DEPT",
  zone_id: "D29",
  territoire_nom: "Finistère",
};
const ILLE_ET_VILAINE: TerritoireTest = {
  territoire_code: "DEPT-35",
  code_insee: "35",
  maille: "DEPT",
  zone_id: "D35",
  territoire_nom: "Ille-et-Vilaine",
};
const COTES_D_ARMOR: TerritoireTest = {
  territoire_code: "DEPT-22",
  code_insee: "22",
  maille: "DEPT",
  zone_id: "D22",
  territoire_nom: "Côtes-d'Armor",
};

async function seedChantier(
  territoires: TerritoireTest[],
  statut: "PUBLIE" | "BROUILLON" = "PUBLIE",
) {
  const chantier = await fixtures.chantierIdentite({ statut });
  for (const territoire of territoires) {
    await fixtures.chantierTerritoire({
      id: chantier.id,
      territoire_code: territoire.territoire_code,
      code_insee: territoire.code_insee,
      maille: territoire.maille,
      zone_id: territoire.zone_id,
    });
  }
  return chantier;
}

const sortByTerritoireCode = <T extends { territoireCode: string }>(
  territoires: T[],
) =>
  territoires.toSorted((left, right) =>
    left.territoireCode.localeCompare(right.territoireCode),
  );

describe("GetTerritoiresNonAJourQuery", () => {
  const query = new GetTerritoiresNonAJourQuery({
    prisma: new PrismaPilote(),
  });

  describe("byChantier", () => {
    it(
      "compte les indicateurs non à jour par territoire",
      createIntegrationTest(async () => {
        // given
        const chantier = await seedChantier([
          FRANCE,
          FINISTERE,
          ILLE_ET_VILAINE,
        ]);
        const indicateur = await fixtures.indicateurIdentite({
          chantier_id: chantier.id,
        });
        const secondIndicateur = await fixtures.indicateurIdentite({
          chantier_id: chantier.id,
        });
        await fixtures.indicateurTerritoire({
          id: indicateur.id,
          chantier_id: chantier.id,
          ...FINISTERE,
          est_applicable: true,
          est_a_jour: false,
        });
        // est_a_jour NULL : aucune valeur remontée, compté non à jour
        await fixtures.indicateurTerritoire({
          id: secondIndicateur.id,
          chantier_id: chantier.id,
          ...FINISTERE,
          est_applicable: true,
          est_a_jour: null,
        });
        await fixtures.indicateurTerritoire({
          id: indicateur.id,
          chantier_id: chantier.id,
          ...ILLE_ET_VILAINE,
          est_applicable: true,
          est_a_jour: true,
        });
        await fixtures.indicateurTerritoire({
          id: secondIndicateur.id,
          chantier_id: chantier.id,
          ...ILLE_ET_VILAINE,
          est_applicable: true,
          est_a_jour: false,
        });
        await fixtures.indicateurTerritoire({
          id: indicateur.id,
          chantier_id: chantier.id,
          ...FRANCE,
          est_applicable: true,
          est_a_jour: true,
        });
        await fixtures.indicateurTerritoire({
          id: secondIndicateur.id,
          chantier_id: chantier.id,
          ...FRANCE,
          est_applicable: true,
          est_a_jour: true,
        });

        // when
        const result = await query.byChantier({ chantierId: chantier.id });

        // then
        expect(sortByTerritoireCode(result)).toEqual([
          {
            territoireCode: "DEPT-29",
            estApplicable: true,
            nbIndicateursNonAJour: 2,
          },
          {
            territoireCode: "DEPT-35",
            estApplicable: true,
            nbIndicateursNonAJour: 1,
          },
          {
            territoireCode: "NAT-FR",
            estApplicable: true,
            nbIndicateursNonAJour: 0,
          },
        ]);
      }),
    );

    it(
      "marque non applicable un territoire sans indicateur applicable, même si est_a_jour est faux",
      createIntegrationTest(async () => {
        // given
        const chantier = await seedChantier([FINISTERE]);
        const indicateur = await fixtures.indicateurIdentite({
          chantier_id: chantier.id,
        });
        await fixtures.indicateurTerritoire({
          id: indicateur.id,
          chantier_id: chantier.id,
          ...FINISTERE,
          est_applicable: false,
          est_a_jour: false,
        });

        // when
        const result = await query.byChantier({ chantierId: chantier.id });

        // then
        expect(result).toEqual([
          {
            territoireCode: "DEPT-29",
            estApplicable: false,
            nbIndicateursNonAJour: 0,
          },
        ]);
      }),
    );

    it(
      "ignore les indicateurs supprimés et les autres chantiers",
      createIntegrationTest(async () => {
        // given
        const chantier = await seedChantier([FINISTERE]);
        const autreChantier = await seedChantier([FINISTERE]);
        const indicateur = await fixtures.indicateurIdentite({
          chantier_id: chantier.id,
        });
        const indicateurSupprime = await fixtures.indicateurIdentite({
          chantier_id: chantier.id,
          statut: "SUPPRIME",
        });
        const indicateurAutreChantier = await fixtures.indicateurIdentite({
          chantier_id: autreChantier.id,
        });
        await fixtures.indicateurTerritoire({
          id: indicateur.id,
          chantier_id: chantier.id,
          ...FINISTERE,
          est_applicable: true,
          est_a_jour: true,
        });
        await fixtures.indicateurTerritoire({
          id: indicateurSupprime.id,
          chantier_id: chantier.id,
          ...FINISTERE,
          est_applicable: true,
          est_a_jour: false,
        });
        await fixtures.indicateurTerritoire({
          id: indicateurAutreChantier.id,
          chantier_id: autreChantier.id,
          ...FINISTERE,
          est_applicable: true,
          est_a_jour: false,
        });

        // when
        const result = await query.byChantier({ chantierId: chantier.id });

        // then
        expect(result).toEqual([
          {
            territoireCode: "DEPT-29",
            estApplicable: true,
            nbIndicateursNonAJour: 0,
          },
        ]);
      }),
    );

    it(
      "ne renvoie rien pour un chantier non publié",
      createIntegrationTest(async () => {
        // given
        const chantier = await seedChantier([FINISTERE], "BROUILLON");
        const indicateur = await fixtures.indicateurIdentite({
          chantier_id: chantier.id,
        });
        await fixtures.indicateurTerritoire({
          id: indicateur.id,
          chantier_id: chantier.id,
          ...FINISTERE,
          est_applicable: true,
          est_a_jour: false,
        });

        // when
        const result = await query.byChantier({ chantierId: chantier.id });

        // then
        expect(result).toEqual([]);
      }),
    );
  });

  describe("byIndicateur", () => {
    it(
      "renvoie l'état et les dates de chaque territoire",
      createIntegrationTest(async () => {
        // given
        const chantier = await seedChantier([
          FINISTERE,
          ILLE_ET_VILAINE,
          COTES_D_ARMOR,
          FRANCE,
        ]);
        const indicateur = await fixtures.indicateurIdentite({
          chantier_id: chantier.id,
        });
        await fixtures.indicateurTerritoire({
          id: indicateur.id,
          chantier_id: chantier.id,
          ...FINISTERE,
          est_applicable: true,
          est_a_jour: false,
          date_valeur_actuelle_mandat: new Date("2026-01-01"),
          prochaine_date_maj: new Date("2026-05-31"),
        });
        await fixtures.indicateurTerritoire({
          id: indicateur.id,
          chantier_id: chantier.id,
          ...ILLE_ET_VILAINE,
          est_applicable: true,
          est_a_jour: true,
          date_valeur_actuelle_mandat: new Date("2026-07-01"),
          prochaine_date_maj: new Date("2026-11-30"),
        });
        // aucune valeur remontée
        await fixtures.indicateurTerritoire({
          id: indicateur.id,
          chantier_id: chantier.id,
          ...COTES_D_ARMOR,
          est_applicable: true,
          est_a_jour: null,
        });
        // applicabilité inconnue : traitée comme non applicable
        await fixtures.indicateurTerritoire({
          id: indicateur.id,
          chantier_id: chantier.id,
          ...FRANCE,
          est_applicable: null,
          est_a_jour: false,
        });

        // when
        const result = await query.byIndicateur({
          chantierId: chantier.id,
          indicateurId: indicateur.id,
        });

        // then
        expect(sortByTerritoireCode(result)).toEqual([
          {
            territoireCode: "DEPT-22",
            estApplicable: true,
            estAJour: false,
            dateDerniereValeur: null,
            miseAJourAttendueDepuis: null,
          },
          {
            territoireCode: "DEPT-29",
            estApplicable: true,
            estAJour: false,
            dateDerniereValeur: "2026-01-01",
            miseAJourAttendueDepuis: "2026-05-31",
          },
          {
            territoireCode: "DEPT-35",
            estApplicable: true,
            estAJour: true,
            dateDerniereValeur: "2026-07-01",
            miseAJourAttendueDepuis: "2026-11-30",
          },
          {
            territoireCode: "NAT-FR",
            estApplicable: false,
            estAJour: false,
            dateDerniereValeur: null,
            miseAJourAttendueDepuis: null,
          },
        ]);
      }),
    );

    it(
      "liste les mêmes territoires non à jour que la requête de l'assistant",
      createIntegrationTest(async () => {
        // given
        const chantier = await seedChantier([
          FINISTERE,
          ILLE_ET_VILAINE,
          COTES_D_ARMOR,
        ]);
        const indicateur = await fixtures.indicateurIdentite({
          chantier_id: chantier.id,
        });
        await fixtures.indicateurTerritoire({
          id: indicateur.id,
          chantier_id: chantier.id,
          ...FINISTERE,
          est_applicable: true,
          est_a_jour: false,
        });
        await fixtures.indicateurTerritoire({
          id: indicateur.id,
          chantier_id: chantier.id,
          ...ILLE_ET_VILAINE,
          est_applicable: true,
          est_a_jour: true,
        });
        await fixtures.indicateurTerritoire({
          id: indicateur.id,
          chantier_id: chantier.id,
          ...COTES_D_ARMOR,
          est_applicable: true,
          est_a_jour: null,
        });
        const assistantQuery = new GetIndicateursNonAJourQuery({
          prisma: new PrismaPilote(),
        });

        // when
        const mapTerritoires = await query.byIndicateur({
          chantierId: chantier.id,
          indicateurId: indicateur.id,
        });
        const assistantResponse = await assistantQuery.execute({
          chantierIds: [chantier.id],
          territoireCodes: ["DEPT-29", "DEPT-35", "DEPT-22"],
          indicateurIds: [indicateur.id],
        });

        // then
        const mapCodes = mapTerritoires
          .filter(
            (territoire) => territoire.estApplicable && !territoire.estAJour,
          )
          .map((territoire) => territoire.territoireCode)
          .toSorted();
        const assistantCodes = assistantResponse
          .map((ligne) => ligne.territoireCode)
          .toSorted();
        expect(mapCodes).toEqual(["DEPT-22", "DEPT-29"]);
        expect(mapCodes).toEqual(assistantCodes);
      }),
    );
  });
});
