import { createIntegrationTest } from "@/test/createIntegrationTest";
import { fixtures } from "@/test/fixtures";
import { PrismaPilote } from "@/server/framework/persistence/PrismaPilote";
import { RecupererIndicateursNonAJourQuery } from "@/server/chantiers/infrastructure/queries/RecupererIndicateursNonAJourQuery";

type TerritoireTest = {
  territoire_code: string;
  code_insee: string;
  maille: "DEPT";
  zone_id: string;
  territoire_nom: string;
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
      });

      // then
      expect(result).toEqual({
        chantiers: [
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
        ],
        indicateursApplicablesIds: ["IND-001"],
      });
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
      expect(result).toEqual({ chantiers: [], indicateursApplicablesIds: [] });
    }),
  );

  it(
    "renvoie un indicateur entièrement à jour dans indicateursApplicablesIds mais pas dans chantiers",
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
        indicateurIds: ["IND-001", "IND-404"],
      });

      // then
      expect(result).toEqual({
        chantiers: [],
        indicateursApplicablesIds: ["IND-001"],
      });
    }),
  );
});
