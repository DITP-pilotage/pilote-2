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

describe("GetIndicateursNonAJourQuery", () => {
  const query = new GetIndicateursNonAJourQuery({
    prisma: new PrismaPilote(),
  });

  it(
    "renvoie une ligne par territoire en retard, y compris sans valeur jamais remontée",
    createIntegrationTest(async () => {
      // given
      const chantier = await seedChantier([
        FINISTERE,
        ILLE_ET_VILAINE,
        COTES_D_ARMOR,
      ]);
      const indicateur = await fixtures.indicateurIdentite({
        chantier_id: chantier.id,
        nom: "Nombre de bornes",
        periodicite: "Trimestrielle",
        delai_disponibilite: 1,
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
      // Aucune valeur jamais remontée et est_a_jour NULL : compté en retard comme dans le mail
      await fixtures.indicateurTerritoire({
        id: indicateur.id,
        chantier_id: chantier.id,
        ...COTES_D_ARMOR,
        est_applicable: true,
        est_a_jour: null,
      });

      // when
      const result = await query.execute({
        chantierIds: [chantier.id],
        territoireCodes: ["DEPT-29", "DEPT-35", "DEPT-22"],
      });

      // then
      expect(result).toEqual([
        {
          chantierId: chantier.id,
          chantierNom: chantier.nom,
          indicateurId: indicateur.id,
          indicateurNom: "Nombre de bornes",
          periodicite: "Trimestrielle",
          delaiDisponibiliteMois: 1,
          maille: "DEPT",
          territoireCode: "DEPT-22",
          territoireNom: "Côtes-d'Armor",
          territoireNomAffiche: "22 - Côtes-d'Armor",
          dateDerniereValeur: null,
          miseAJourAttendueDepuis: null,
        },
        {
          chantierId: chantier.id,
          chantierNom: chantier.nom,
          indicateurId: indicateur.id,
          indicateurNom: "Nombre de bornes",
          periodicite: "Trimestrielle",
          delaiDisponibiliteMois: 1,
          maille: "DEPT",
          territoireCode: "DEPT-29",
          territoireNom: "Finistère",
          territoireNomAffiche: "29 - Finistère",
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
      const chantierPublie = await seedChantier([FINISTERE, ILLE_ET_VILAINE]);
      const chantierBrouillon = await seedChantier([FINISTERE], "BROUILLON");
      const indicateur = await fixtures.indicateurIdentite({
        chantier_id: chantierPublie.id,
      });
      const indicateurSupprime = await fixtures.indicateurIdentite({
        chantier_id: chantierPublie.id,
        statut: "SUPPRIME",
      });
      const indicateurChantierBrouillon = await fixtures.indicateurIdentite({
        chantier_id: chantierBrouillon.id,
      });
      await fixtures.indicateurTerritoire({
        id: indicateur.id,
        chantier_id: chantierPublie.id,
        ...FINISTERE,
        est_applicable: false,
        est_a_jour: false,
      });
      // Hors des territoires demandés : ni listé ni compté
      await fixtures.indicateurTerritoire({
        id: indicateur.id,
        chantier_id: chantierPublie.id,
        ...ILLE_ET_VILAINE,
        est_applicable: true,
        est_a_jour: false,
      });
      await fixtures.indicateurTerritoire({
        id: indicateurSupprime.id,
        chantier_id: chantierPublie.id,
        ...FINISTERE,
        est_applicable: true,
        est_a_jour: false,
      });
      await fixtures.indicateurTerritoire({
        id: indicateurChantierBrouillon.id,
        chantier_id: chantierBrouillon.id,
        ...FINISTERE,
        est_applicable: true,
        est_a_jour: false,
      });

      // when
      const result = await query.execute({
        chantierIds: [chantierPublie.id, chantierBrouillon.id],
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
      const chantierDansPerimetre = await seedChantier([FINISTERE]);
      const chantierHorsPerimetre = await seedChantier([FINISTERE]);
      const indicateurHorsPerimetre = await fixtures.indicateurIdentite({
        chantier_id: chantierHorsPerimetre.id,
      });
      await fixtures.indicateurTerritoire({
        id: indicateurHorsPerimetre.id,
        chantier_id: chantierHorsPerimetre.id,
        ...FINISTERE,
        est_applicable: true,
        est_a_jour: false,
      });

      // when
      const result = await query.execute({
        chantierIds: [chantierDansPerimetre.id],
        territoireCodes: ["DEPT-29"],
        indicateurIds: [indicateurHorsPerimetre.id],
      });

      // then
      expect(result).toEqual([]);
    }),
  );

  it(
    "ne renvoie pas un indicateur entièrement à jour",
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
        est_applicable: true,
        est_a_jour: true,
      });

      // when
      const result = await query.execute({
        chantierIds: [chantier.id],
        territoireCodes: ["DEPT-29"],
        indicateurIds: [indicateur.id],
      });

      // then
      expect(result).toEqual([]);
    }),
  );

  it(
    "trie les lignes par chantier, indicateur et territoire",
    createIntegrationTest(async () => {
      // given
      const [premierChantier, secondChantier] = [
        await fixtures.chantierIdentite({ statut: "PUBLIE" }),
        await fixtures.chantierIdentite({ statut: "PUBLIE" }),
      ].sort((gauche, droite) => gauche.id.localeCompare(droite.id));
      for (const [chantierId, territoire] of [
        [secondChantier.id, FRANCE],
        [secondChantier.id, FINISTERE],
        [premierChantier.id, FRANCE],
        [premierChantier.id, FINISTERE],
        [premierChantier.id, ILLE_ET_VILAINE],
      ] as const) {
        await fixtures.chantierTerritoire({
          id: chantierId,
          territoire_code: territoire.territoire_code,
          code_insee: territoire.code_insee,
          maille: territoire.maille,
          zone_id: territoire.zone_id,
        });
      }
      const [premierIndicateur, secondIndicateur] = [
        await fixtures.indicateurIdentite({
          chantier_id: premierChantier.id,
          periodicite: "Mensuelle",
          delai_disponibilite: 0,
        }),
        await fixtures.indicateurIdentite({
          chantier_id: premierChantier.id,
          periodicite: "Mensuelle",
          delai_disponibilite: 0,
        }),
      ].sort((gauche, droite) => gauche.id.localeCompare(droite.id));
      const indicateurSecondChantier = await fixtures.indicateurIdentite({
        chantier_id: secondChantier.id,
        periodicite: "Mensuelle",
        delai_disponibilite: 0,
      });
      const lignes: [string, string, TerritoireTest, boolean | null][] = [
        [indicateurSecondChantier.id, secondChantier.id, FRANCE, false],
        [secondIndicateur.id, premierChantier.id, ILLE_ET_VILAINE, false],
        [secondIndicateur.id, premierChantier.id, FINISTERE, true],
        [premierIndicateur.id, premierChantier.id, FRANCE, false],
        [premierIndicateur.id, premierChantier.id, ILLE_ET_VILAINE, null],
        [premierIndicateur.id, premierChantier.id, FINISTERE, false],
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
        chantierIds: [premierChantier.id, secondChantier.id],
        territoireCodes: ["NAT-FR", "DEPT-29", "DEPT-35"],
      });

      // then
      expect(
        result.map(
          ({ chantierId, indicateurId, territoireCode }) =>
            `${chantierId} ${indicateurId} ${territoireCode}`,
        ),
      ).toEqual([
        `${premierChantier.id} ${premierIndicateur.id} DEPT-29`,
        `${premierChantier.id} ${premierIndicateur.id} DEPT-35`,
        `${premierChantier.id} ${premierIndicateur.id} NAT-FR`,
        `${premierChantier.id} ${secondIndicateur.id} DEPT-35`,
        `${secondChantier.id} ${indicateurSecondChantier.id} NAT-FR`,
      ]);
    }),
  );
});
