import { createIntegrationTest } from "@/test/createIntegrationTest";
import { fixtures } from "@/test/fixtures";
import { PrismaPilote } from "@/server/framework/persistence/PrismaPilote";
import { RecupererIndicateursNonAJourQuery } from "@/server/chantiers/infrastructure/queries/RecupererIndicateursNonAJourQuery";

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

describe("RecupererIndicateursNonAJourQuery", () => {
  const query = new RecupererIndicateursNonAJourQuery({
    prisma: new PrismaPilote(),
  });

  it(
    "regroupe les territoires en retard par chantier, indicateur et maille",
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
        avecDetailTerritoires: true,
      });

      // then
      expect(result).toEqual([
        {
          chantier: { id: "CH-001", nom: "Chantier CH-001" },
          indicateurs: [
            {
              id: "IND-001",
              nom: "Nombre de bornes",
              periodicite: "Trimestrielle",
              delaiDisponibiliteMois: 1,
              mailles: [
                {
                  maille: "DEPT",
                  nbTerritoiresEnRetard: 2,
                  nbTerritoiresApplicables: 3,
                  territoiresEnRetard: [
                    {
                      code: "DEPT-22",
                      nom: "Côtes-d'Armor",
                      dateDerniereValeur: null,
                      miseAJourAttendueDepuis: null,
                    },
                    {
                      code: "DEPT-29",
                      nom: "Finistère",
                      dateDerniereValeur: "2026-01-01",
                      miseAJourAttendueDepuis: "2026-05-31",
                    },
                  ],
                },
              ],
            },
          ],
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
        avecDetailTerritoires: true,
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
        avecDetailTerritoires: true,
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
        avecDetailTerritoires: true,
      });

      // then
      expect(result).toEqual([]);
    }),
  );

  it(
    "sans détail des territoires, ne renvoie que les compteurs par maille",
    createIntegrationTest(async () => {
      // given
      await seedChantier("CH-001", [FINISTERE, ILLE_ET_VILAINE]);
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
      });
      await fixtures.indicateurTerritoire({
        id: "IND-001",
        chantier_id: "CH-001",
        ...ILLE_ET_VILAINE,
        est_applicable: true,
        est_a_jour: true,
      });

      // when
      const result = await query.execute({
        chantierIds: ["CH-001"],
        territoireCodes: ["DEPT-29", "DEPT-35"],
        avecDetailTerritoires: false,
      });

      // then
      expect(result).toEqual([
        {
          chantier: { id: "CH-001", nom: "Chantier CH-001" },
          indicateurs: [
            {
              id: "IND-001",
              nom: "Nombre de bornes",
              periodicite: "Trimestrielle",
              delaiDisponibiliteMois: 1,
              mailles: [
                {
                  maille: "DEPT",
                  nbTerritoiresEnRetard: 1,
                  nbTerritoiresApplicables: 2,
                },
              ],
            },
          ],
        },
      ]);
    }),
  );

  it(
    "en mode compteurs, regroupe plusieurs chantiers, indicateurs et mailles dans l'ordre",
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
        avecDetailTerritoires: false,
      });

      // then
      expect(result).toEqual([
        {
          chantier: { id: "CH-001", nom: "Chantier CH-001" },
          indicateurs: [
            {
              id: "IND-001",
              nom: "Indicateur IND-001",
              periodicite: "Mensuelle",
              delaiDisponibiliteMois: 0,
              mailles: [
                {
                  maille: "NAT",
                  nbTerritoiresEnRetard: 1,
                  nbTerritoiresApplicables: 1,
                },
                {
                  maille: "DEPT",
                  nbTerritoiresEnRetard: 2,
                  nbTerritoiresApplicables: 2,
                },
              ],
            },
            {
              id: "IND-002",
              nom: "Indicateur IND-002",
              periodicite: "Mensuelle",
              delaiDisponibiliteMois: 0,
              mailles: [
                {
                  maille: "DEPT",
                  nbTerritoiresEnRetard: 1,
                  nbTerritoiresApplicables: 2,
                },
              ],
            },
          ],
        },
        {
          chantier: { id: "CH-002", nom: "Chantier CH-002" },
          indicateurs: [
            {
              id: "IND-003",
              nom: "Indicateur IND-003",
              periodicite: "Mensuelle",
              delaiDisponibiliteMois: 0,
              mailles: [
                {
                  maille: "NAT",
                  nbTerritoiresEnRetard: 1,
                  nbTerritoiresApplicables: 1,
                },
              ],
            },
          ],
        },
      ]);
    }),
  );
});
