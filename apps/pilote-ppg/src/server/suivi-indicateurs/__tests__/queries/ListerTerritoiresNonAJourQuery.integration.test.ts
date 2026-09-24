import { $Enums } from "@prisma/client";
import { PrismaPilote } from "@/server/db/PrismaPilote";
import { ListerTerritoiresNonAJourQuery } from "@/server/suivi-indicateurs/queries/ListerTerritoiresNonAJourQuery";
import { createIntegrationTest } from "@/server/infrastructure/test/createIntegrationTest";
import { fixtures } from "@/server/infrastructure/test/fixtures";

const TERRITOIRES = [
  {
    territoire_code: "NAT-FR",
    zone_id: "FRANCE",
    code_insee: "FR",
    maille: $Enums.Maille.NAT,
  },
  {
    territoire_code: "DEPT-01",
    zone_id: "D01",
    code_insee: "01",
    maille: $Enums.Maille.DEPT,
  },
  {
    territoire_code: "DEPT-02",
    zone_id: "D02",
    code_insee: "02",
    maille: $Enums.Maille.DEPT,
  },
];

const creerIndicateur = async (chantierId: string, indicateurId: string) => {
  const chantier = await fixtures.chantierIdentite({ id: chantierId });
  for (const territoire of TERRITOIRES) {
    await fixtures.chantierTerritoire({ id: chantier.id, ...territoire });
  }
  return fixtures.indicateurIdentite({
    id: indicateurId,
    chantier_id: chantier.id,
  });
};

describe("ListerTerritoiresNonAJourQuery", () => {
  let query: ListerTerritoiresNonAJourQuery;
  const prismaPilote = new PrismaPilote();

  beforeEach(() => {
    query = new ListerTerritoiresNonAJourQuery({ prisma: prismaPilote });
  });

  it(
    "liste les territoires non à jour triés par retard décroissant, retard inconnu en dernier",
    createIntegrationTest(async () => {
      // Given
      const indicateur = await creerIndicateur("CH-911", "IND-911");
      const [nat, dept01, dept02] = TERRITOIRES;
      await fixtures.indicateurTerritoire({
        id: indicateur.id,
        chantier_id: "CH-911",
        ...nat,
        est_applicable: true,
        est_a_jour: false,
        prochaine_date_maj_jours: -10,
        date_valeur_actuelle_mandat: new Date("2026-06-30"),
        prochaine_date_maj: new Date("2026-09-14"),
      });
      await fixtures.indicateurTerritoire({
        id: indicateur.id,
        chantier_id: "CH-911",
        ...dept01,
        est_applicable: true,
        est_a_jour: null,
        prochaine_date_maj_jours: null,
      });
      await fixtures.indicateurTerritoire({
        id: indicateur.id,
        chantier_id: "CH-911",
        ...dept02,
        est_applicable: true,
        est_a_jour: false,
        prochaine_date_maj_jours: -86,
        date_valeur_actuelle_mandat: new Date("2026-03-31"),
        prochaine_date_maj: new Date("2026-06-30"),
      });
      const nomsTerritoires = new Map(
        (
          await prismaPilote.getInstance().territoire.findMany({
            where: {
              code: {
                in: TERRITOIRES.map((territoire) => territoire.territoire_code),
              },
            },
          })
        ).map((territoire) => [territoire.code, territoire.nom]),
      );

      // When
      const resultat = await query.run(indicateur.id, ["CH-911"]);

      // Then
      expect(resultat).toEqual([
        {
          code: "DEPT-02",
          nom: nomsTerritoires.get("DEPT-02"),
          maille: $Enums.Maille.DEPT,
          dateDerniereValeur: "2026-03-31T00:00:00.000Z",
          dateMajAttendue: "2026-06-30T00:00:00.000Z",
          retardJours: 86,
        },
        {
          code: "NAT-FR",
          nom: nomsTerritoires.get("NAT-FR"),
          maille: $Enums.Maille.NAT,
          dateDerniereValeur: "2026-06-30T00:00:00.000Z",
          dateMajAttendue: "2026-09-14T00:00:00.000Z",
          retardJours: 10,
        },
        {
          code: "DEPT-01",
          nom: nomsTerritoires.get("DEPT-01"),
          maille: $Enums.Maille.DEPT,
          dateDerniereValeur: null,
          dateMajAttendue: null,
          retardJours: null,
        },
      ]);
    }),
  );

  it(
    "renvoie une liste vide pour un indicateur hors du périmètre de l'utilisateur",
    createIntegrationTest(async () => {
      // Given
      const indicateur = await creerIndicateur("CH-912", "IND-912");
      await fixtures.indicateurTerritoire({
        id: indicateur.id,
        chantier_id: "CH-912",
        ...TERRITOIRES[0],
        est_applicable: true,
        est_a_jour: false,
      });

      // When
      const resultat = await query.run(indicateur.id, ["CH-AUTRE"]);

      // Then
      expect(resultat).toEqual([]);
    }),
  );
});
