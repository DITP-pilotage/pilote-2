import { createIntegrationTest } from "@/test/createIntegrationTest";
import { fixtures } from "@/test/fixtures";
import { PrismaPilote } from "@/server/framework/persistence/PrismaPilote";
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
  chantierId: string,
  territoires: TerritoireTest[],
  statut: "PUBLIE" | "BROUILLON" = "PUBLIE",
) {
  await fixtures.chantierIdentite({ id: chantierId, statut });
  for (const territoire of territoires) {
    await fixtures.chantierTerritoire({
      id: chantierId,
      territoire_code: territoire.territoire_code,
      code_insee: territoire.code_insee,
      maille: territoire.maille,
      zone_id: territoire.zone_id,
    });
  }
}

describe("GetIndicateursNonAJourQuery", () => {
  const query = new GetIndicateursNonAJourQuery({
    prisma: new PrismaPilote(),
  });

  it(
    "renvoie une ligne par territoire en retard, y compris sans valeur jamais remontée",
    createIntegrationTest(async () => {
      // given
      await seedChantier("CH-001", [FINISTERE, ILLE_ET_VILAINE, COTES_D_ARMOR]);
      await fixtures.indicateurIdentite({
        id: "IND-001",
        chantier_id: "CH-001",
        nom: "Nombre de bornes",
        periodicite: "Trimestrielle",
        delai_disponibilite: 1,
      });
      await fixtures.indicateurTerritoire({
        id: "IND-001",
        chantier_id: "CH-001",
        ...FINISTERE,
        est_applicable: true,
        est_a_jour: false,
        date_valeur_actuelle_mandat: new Date("2026-01-01"),
        prochaine_date_maj: new Date("2026-05-31"),
      });
      await fixtures.indicateurTerritoire({
        id: "IND-001",
        chantier_id: "CH-001",
        ...ILLE_ET_VILAINE,
        est_applicable: true,
        est_a_jour: true,
        date_valeur_actuelle_mandat: new Date("2026-07-01"),
        prochaine_date_maj: new Date("2026-11-30"),
      });
      // Aucune valeur jamais remontée et est_a_jour NULL : compté en retard comme dans le mail
      await fixtures.indicateurTerritoire({
        id: "IND-001",
        chantier_id: "CH-001",
        ...COTES_D_ARMOR,
        est_applicable: true,
        est_a_jour: null,
      });

      // when
      const result = await query.execute({
        chantierIds: ["CH-001"],
        territoireCodes: ["DEPT-29", "DEPT-35", "DEPT-22"],
      });

      // then
      expect(result).toEqual([
        {
          chantierId: "CH-001",
          chantierNom: "Chantier CH-001",
          indicateurId: "IND-001",
          indicateurNom: "Nombre de bornes",
          periodicite: "Trimestrielle",
          delaiDisponibiliteMois: 1,
          maille: "DEPT",
          territoireCode: "DEPT-22",
          territoireNom: "Côtes-d'Armor",
          dateDerniereValeur: null,
          miseAJourAttendueDepuis: null,
        },
        {
          chantierId: "CH-001",
          chantierNom: "Chantier CH-001",
          indicateurId: "IND-001",
          indicateurNom: "Nombre de bornes",
          periodicite: "Trimestrielle",
          delaiDisponibiliteMois: 1,
          maille: "DEPT",
          territoireCode: "DEPT-29",
          territoireNom: "Finistère",
          dateDerniereValeur: "2026-01-01",
          miseAJourAttendueDepuis: "2026-05-31",
        },
      ]);
    }),
  );

  it(
    "exclut les territoires non applicables, hors périmètre, et les chantiers ou indicateurs non publiés",
    createIntegrationTest(async () => {
      // given
      await seedChantier("CH-001", [FINISTERE, ILLE_ET_VILAINE]);
      await seedChantier("CH-002", [FINISTERE], "BROUILLON");
      await fixtures.indicateurIdentite({
        id: "IND-001",
        chantier_id: "CH-001",
      });
      await fixtures.indicateurIdentite({
        id: "IND-003",
        chantier_id: "CH-001",
        statut: "SUPPRIME",
      });
      await fixtures.indicateurIdentite({
        id: "IND-002",
        chantier_id: "CH-002",
      });
      await fixtures.indicateurTerritoire({
        id: "IND-001",
        chantier_id: "CH-001",
        ...FINISTERE,
        est_applicable: false,
        est_a_jour: false,
      });
      // Hors des territoires demandés : ni listé ni compté
      await fixtures.indicateurTerritoire({
        id: "IND-001",
        chantier_id: "CH-001",
        ...ILLE_ET_VILAINE,
        est_applicable: true,
        est_a_jour: false,
      });
      await fixtures.indicateurTerritoire({
        id: "IND-003",
        chantier_id: "CH-001",
        ...FINISTERE,
        est_applicable: true,
        est_a_jour: false,
      });
      await fixtures.indicateurTerritoire({
        id: "IND-002",
        chantier_id: "CH-002",
        ...FINISTERE,
        est_applicable: true,
        est_a_jour: false,
      });

      // when
      const result = await query.execute({
        chantierIds: ["CH-001", "CH-002"],
        territoireCodes: ["DEPT-29"],
      });

      // then
      expect(result).toEqual([]);
    }),
  );

  it(
    "ne renvoie pas un indicateur demandé rattaché à un chantier hors périmètre",
    createIntegrationTest(async () => {
      // given
      await seedChantier("CH-001", [FINISTERE]);
      await seedChantier("CH-002", [FINISTERE]);
      await fixtures.indicateurIdentite({
        id: "IND-002",
        chantier_id: "CH-002",
      });
      await fixtures.indicateurTerritoire({
        id: "IND-002",
        chantier_id: "CH-002",
        ...FINISTERE,
        est_applicable: true,
        est_a_jour: false,
      });

      // when
      const result = await query.execute({
        chantierIds: ["CH-001"],
        territoireCodes: ["DEPT-29"],
        indicateurIds: ["IND-002"],
      });

      // then
      expect(result).toEqual([]);
    }),
  );

  it(
    "ne renvoie pas un indicateur entièrement à jour",
    createIntegrationTest(async () => {
      // given
      await seedChantier("CH-001", [FINISTERE]);
      await fixtures.indicateurIdentite({
        id: "IND-001",
        chantier_id: "CH-001",
      });
      await fixtures.indicateurTerritoire({
        id: "IND-001",
        chantier_id: "CH-001",
        ...FINISTERE,
        est_applicable: true,
        est_a_jour: true,
      });

      // when
      const result = await query.execute({
        chantierIds: ["CH-001"],
        territoireCodes: ["DEPT-29"],
        indicateurIds: ["IND-001"],
      });

      // then
      expect(result).toEqual([]);
    }),
  );

  it(
    "trie les lignes par chantier, indicateur et territoire",
    createIntegrationTest(async () => {
      // given
      await seedChantier("CH-002", [FRANCE, FINISTERE]);
      await seedChantier("CH-001", [FRANCE, FINISTERE, ILLE_ET_VILAINE]);
      for (const [indicateurId, chantierId] of [
        ["IND-003", "CH-002"],
        ["IND-002", "CH-001"],
        ["IND-001", "CH-001"],
      ]) {
        await fixtures.indicateurIdentite({
          id: indicateurId,
          chantier_id: chantierId,
          nom: `Indicateur ${indicateurId}`,
          periodicite: "Mensuelle",
          delai_disponibilite: 0,
        });
      }
      const lignes: [string, string, TerritoireTest, boolean | null][] = [
        ["IND-001", "CH-001", FINISTERE, false],
        ["IND-001", "CH-001", ILLE_ET_VILAINE, null],
        ["IND-001", "CH-001", FRANCE, false],
        ["IND-002", "CH-001", FINISTERE, true],
        ["IND-002", "CH-001", ILLE_ET_VILAINE, false],
        ["IND-003", "CH-002", FRANCE, false],
      ];
      for (const [indicateurId, chantierId, territoire, estAJour] of lignes) {
        await fixtures.indicateurTerritoire({
          id: indicateurId,
          chantier_id: chantierId,
          ...territoire,
          est_applicable: true,
          est_a_jour: estAJour,
        });
      }

      // when
      const result = await query.execute({
        chantierIds: ["CH-001", "CH-002"],
        territoireCodes: ["NAT-FR", "DEPT-29", "DEPT-35"],
      });

      // then
      expect(
        result.map(
          ({ chantierId, indicateurId, territoireCode }) =>
            `${chantierId} ${indicateurId} ${territoireCode}`,
        ),
      ).toEqual([
        "CH-001 IND-001 DEPT-29",
        "CH-001 IND-001 DEPT-35",
        "CH-001 IND-001 NAT-FR",
        "CH-001 IND-002 DEPT-35",
        "CH-002 IND-003 NAT-FR",
      ]);
    }),
  );
});
