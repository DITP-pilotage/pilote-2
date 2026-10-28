import { createIntegrationTest } from "@/test/createIntegrationTest";
import { fixtures } from "@/test/fixtures";
import { PrismaPilote } from "@/server/framework/persistence/PrismaPilote";
import { GetIndicateursSansViVcQuery } from "@/server/chantiers/infrastructure/queries/GetIndicateursSansViVcQuery";

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

const JALON = 2026;

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

async function seedIndicateurTerritoire({
  indicateurId,
  chantierId,
  territoire,
  valeurInitiale,
  valeursCibles = {},
  estApplicable = true,
}: {
  indicateurId: string;
  chantierId: string;
  territoire: TerritoireTest;
  valeurInitiale: number | null;
  valeursCibles?: Record<number, number | null>;
  estApplicable?: boolean;
}) {
  await fixtures.indicateurTerritoire({
    id: indicateurId,
    chantier_id: chantierId,
    ...territoire,
    est_applicable: estApplicable,
    valeur_initiale: valeurInitiale,
  });
  for (const [jalon, valeurCible] of Object.entries(valeursCibles)) {
    await fixtures.indicateurTerritoireJalon({
      id: indicateurId,
      territoire_code: territoire.territoire_code,
      code_insee: territoire.code_insee,
      maille: territoire.maille,
      zone_id: territoire.zone_id,
      jalon: Number(jalon),
      valeur_cible: valeurCible,
    });
  }
}

async function seedTroisDepartements() {
  await seedChantier("CH-001", [FINISTERE, ILLE_ET_VILAINE, COTES_D_ARMOR]);
  await fixtures.indicateurIdentite({
    id: "IND-001",
    chantier_id: "CH-001",
    nom: "Nombre de bornes",
  });
  await seedIndicateurTerritoire({
    indicateurId: "IND-001",
    chantierId: "CH-001",
    territoire: FINISTERE,
    valeurInitiale: null,
    valeursCibles: { [JALON]: 100 },
  });
  await seedIndicateurTerritoire({
    indicateurId: "IND-001",
    chantierId: "CH-001",
    territoire: ILLE_ET_VILAINE,
    valeurInitiale: 10,
    valeursCibles: { [JALON]: null },
  });
  await seedIndicateurTerritoire({
    indicateurId: "IND-001",
    chantierId: "CH-001",
    territoire: COTES_D_ARMOR,
    valeurInitiale: null,
    valeursCibles: { [JALON]: null },
  });
}

const TROIS_DEPARTEMENTS = {
  chantierIds: ["CH-001"],
  territoireCodes: ["DEPT-29", "DEPT-35", "DEPT-22"],
  jalon: JALON,
  withTerritoiresDetail: true,
};

describe("GetIndicateursSansViVcQuery", () => {
  const query = new GetIndicateursSansViVcQuery({
    prisma: new PrismaPilote(),
  });

  it(
    "regroupe les territoires sans VI ou sans VC par chantier, indicateur et maille, avec les valeurs manquantes",
    createIntegrationTest(async () => {
      // given
      await seedTroisDepartements();

      // when
      const result = await query.execute({
        ...TROIS_DEPARTEMENTS,
        missing: "vi_or_vc",
      });

      // then
      expect(result).toEqual([
        {
          chantier: { id: "CH-001", nom: "Chantier CH-001" },
          indicateurs: [
            {
              id: "IND-001",
              nom: "Nombre de bornes",
              mailles: [
                {
                  maille: "DEPT",
                  nbTerritoiresSansVi: 2,
                  nbTerritoiresSansVc: 2,
                  nbTerritoiresApplicables: 3,
                  territoires: [
                    {
                      code: "DEPT-22",
                      nom: "Côtes-d'Armor",
                      valeursManquantes: ["valeur initiale", "valeur cible"],
                    },
                    {
                      code: "DEPT-29",
                      nom: "Finistère",
                      valeursManquantes: ["valeur initiale"],
                    },
                    {
                      code: "DEPT-35",
                      nom: "Ille-et-Vilaine",
                      valeursManquantes: ["valeur cible"],
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
    "ne remonte pas un territoire sans ligne de jalon, ni une VC manquante sur un autre jalon",
    createIntegrationTest(async () => {
      // given
      await seedChantier("CH-001", [FINISTERE, ILLE_ET_VILAINE]);
      await fixtures.indicateurIdentite({
        id: "IND-001",
        chantier_id: "CH-001",
      });
      // Aucune ligne de jalon : rien n'est remonté, comme dans le mail
      await seedIndicateurTerritoire({
        indicateurId: "IND-001",
        chantierId: "CH-001",
        territoire: FINISTERE,
        valeurInitiale: 10,
      });
      await seedIndicateurTerritoire({
        indicateurId: "IND-001",
        chantierId: "CH-001",
        territoire: ILLE_ET_VILAINE,
        valeurInitiale: 10,
        valeursCibles: { [JALON - 1]: null, [JALON]: 100 },
      });

      // when
      const result = await query.execute({
        chantierIds: ["CH-001"],
        territoireCodes: ["DEPT-29", "DEPT-35"],
        jalon: JALON,
        missing: "vi_or_vc",
        withTerritoiresDetail: true,
      });

      // then
      expect(result).toEqual([]);
    }),
  );

  it(
    "ne remonte que les territoires sans VI quand seule la VI est demandée",
    createIntegrationTest(async () => {
      // given
      await seedTroisDepartements();

      // when
      const result = await query.execute({
        ...TROIS_DEPARTEMENTS,
        missing: "vi",
      });

      // then
      expect(result).toEqual([
        {
          chantier: { id: "CH-001", nom: "Chantier CH-001" },
          indicateurs: [
            {
              id: "IND-001",
              nom: "Nombre de bornes",
              mailles: [
                {
                  maille: "DEPT",
                  nbTerritoiresSansVi: 2,
                  nbTerritoiresApplicables: 3,
                  territoires: [
                    {
                      code: "DEPT-22",
                      nom: "Côtes-d'Armor",
                      valeursManquantes: ["valeur initiale"],
                    },
                    {
                      code: "DEPT-29",
                      nom: "Finistère",
                      valeursManquantes: ["valeur initiale"],
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
    "ne remonte que les territoires sans VC quand seule la VC est demandée",
    createIntegrationTest(async () => {
      // given
      await seedTroisDepartements();

      // when
      const result = await query.execute({
        ...TROIS_DEPARTEMENTS,
        missing: "vc",
      });

      // then
      expect(result).toEqual([
        {
          chantier: { id: "CH-001", nom: "Chantier CH-001" },
          indicateurs: [
            {
              id: "IND-001",
              nom: "Nombre de bornes",
              mailles: [
                {
                  maille: "DEPT",
                  nbTerritoiresSansVc: 2,
                  nbTerritoiresApplicables: 3,
                  territoires: [
                    {
                      code: "DEPT-22",
                      nom: "Côtes-d'Armor",
                      valeursManquantes: ["valeur cible"],
                    },
                    {
                      code: "DEPT-35",
                      nom: "Ille-et-Vilaine",
                      valeursManquantes: ["valeur cible"],
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
    "sans détail, ne renvoie que les compteurs des mailles concernées",
    createIntegrationTest(async () => {
      // given
      await seedChantier("CH-001", [FRANCE, FINISTERE, ILLE_ET_VILAINE]);
      await fixtures.indicateurIdentite({
        id: "IND-001",
        chantier_id: "CH-001",
        nom: "Nombre de bornes",
      });
      await seedIndicateurTerritoire({
        indicateurId: "IND-001",
        chantierId: "CH-001",
        territoire: FRANCE,
        valeurInitiale: 10,
        valeursCibles: { [JALON]: 100 },
      });
      await seedIndicateurTerritoire({
        indicateurId: "IND-001",
        chantierId: "CH-001",
        territoire: FINISTERE,
        valeurInitiale: null,
        valeursCibles: { [JALON]: 100 },
      });
      await seedIndicateurTerritoire({
        indicateurId: "IND-001",
        chantierId: "CH-001",
        territoire: ILLE_ET_VILAINE,
        valeurInitiale: 10,
        valeursCibles: { [JALON]: 100 },
      });

      // when
      const result = await query.execute({
        chantierIds: ["CH-001"],
        territoireCodes: ["NAT-FR", "DEPT-29", "DEPT-35"],
        jalon: JALON,
        missing: "vi_or_vc",
        withTerritoiresDetail: false,
      });

      // then
      expect(result).toEqual([
        {
          chantier: { id: "CH-001", nom: "Chantier CH-001" },
          indicateurs: [
            {
              id: "IND-001",
              nom: "Nombre de bornes",
              mailles: [
                {
                  maille: "DEPT",
                  nbTerritoiresSansVi: 1,
                  nbTerritoiresSansVc: 0,
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
      await seedIndicateurTerritoire({
        indicateurId: "IND-001",
        chantierId: "CH-001",
        territoire: FINISTERE,
        valeurInitiale: null,
        estApplicable: false,
      });
      // Hors des territoires demandés : ni listé ni compté
      await seedIndicateurTerritoire({
        indicateurId: "IND-001",
        chantierId: "CH-001",
        territoire: ILLE_ET_VILAINE,
        valeurInitiale: null,
      });
      await seedIndicateurTerritoire({
        indicateurId: "IND-003",
        chantierId: "CH-001",
        territoire: FINISTERE,
        valeurInitiale: null,
      });
      await seedIndicateurTerritoire({
        indicateurId: "IND-002",
        chantierId: "CH-002",
        territoire: FINISTERE,
        valeurInitiale: null,
      });

      // when
      const result = await query.execute({
        chantierIds: ["CH-001", "CH-002"],
        territoireCodes: ["DEPT-29"],
        jalon: JALON,
        missing: "vi_or_vc",
        withTerritoiresDetail: true,
      });

      // then
      expect(result).toEqual([]);
    }),
  );
});
