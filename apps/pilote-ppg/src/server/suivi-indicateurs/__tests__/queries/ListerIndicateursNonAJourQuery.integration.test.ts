import { $Enums } from "@prisma/client";
import { PrismaPilote } from "@/server/db/PrismaPilote";
import { ListerIndicateursNonAJourQuery } from "@/server/suivi-indicateurs/queries/ListerIndicateursNonAJourQuery";
import { createIntegrationTest } from "@/server/infrastructure/test/createIntegrationTest";
import { fixtures } from "@/server/infrastructure/test/fixtures";

const JALON = 2026;

const creerChantierAvecTerritoires = async (overrides: {
  id: string;
  statut?: $Enums.type_statut;
}) => {
  const chantier = await fixtures.chantierIdentite({
    id: overrides.id,
    nom: `Chantier ${overrides.id}`,
    statut: overrides.statut ?? $Enums.type_statut.PUBLIE,
  });
  await fixtures.chantierTerritoire({
    id: chantier.id,
    territoire_code: "NAT-FR",
    zone_id: "FRANCE",
    code_insee: "FR",
    maille: $Enums.Maille.NAT,
  });
  await fixtures.chantierTerritoire({
    id: chantier.id,
    territoire_code: "DEPT-01",
    zone_id: "D01",
    code_insee: "01",
    maille: $Enums.Maille.DEPT,
  });
  return chantier;
};

const territoireDept01 = {
  territoire_code: "DEPT-01",
  zone_id: "D01",
  code_insee: "01",
  maille: $Enums.Maille.DEPT,
};

describe("ListerIndicateursNonAJourQuery", () => {
  let query: ListerIndicateursNonAJourQuery;

  beforeEach(() => {
    query = new ListerIndicateursNonAJourQuery({ prisma: new PrismaPilote() });
  });

  it(
    "agrège par indicateur les territoires non à jour des chantiers demandés",
    createIntegrationTest(async () => {
      // Given
      const chantier = await creerChantierAvecTerritoires({ id: "CH-901" });
      const indicateur = await fixtures.indicateurIdentite({
        id: "IND-901",
        chantier_id: chantier.id,
        nom: "Rénovations",
        periodicite: "Trimestrielle",
        delai_disponibilite: 2,
        responsables_donnees_mails: ["donnees@exemple.gouv.fr"],
      });
      await fixtures.indicateurTerritoire({
        id: indicateur.id,
        chantier_id: chantier.id,
        territoire_code: "NAT-FR",
        est_applicable: true,
        est_a_jour: false,
        valeur_initiale: 1,
        prochaine_date_maj_jours: -10,
        date_valeur_actuelle_mandat: new Date("2026-06-30"),
        prochaine_date_maj: new Date("2026-09-14"),
      });
      await fixtures.indicateurTerritoire({
        id: indicateur.id,
        chantier_id: chantier.id,
        ...territoireDept01,
        est_applicable: true,
        est_a_jour: null,
        valeur_initiale: 1,
        prochaine_date_maj_jours: -86,
        date_valeur_actuelle_mandat: new Date("2026-03-31"),
        prochaine_date_maj: new Date("2026-06-30"),
      });

      // When
      const resultat = await query.run([chantier.id], JALON);

      // Then
      expect(resultat).toEqual({
        nonAJour: [
          {
            chantierId: "CH-901",
            chantierNom: "Chantier CH-901",
            indicateurId: "IND-901",
            nom: "Rénovations",
            periodicite: "Trimestrielle",
            delaiDisponibilite: 2,
            mailles: [$Enums.Maille.NAT, $Enums.Maille.DEPT],
            nbTerritoiresEnRetard: 2,
            nbTerritoiresApplicables: 2,
            retardMaxJours: 86,
            dateDerniereValeurPlusAncienne: "2026-03-31T00:00:00.000Z",
            dateMajAttenduePlusAncienne: "2026-06-30T00:00:00.000Z",
            responsablesDonneesMails: ["donnees@exemple.gouv.fr"],
          },
        ],
        aParametrer: [],
      });
    }),
  );

  it(
    "exclut les territoires à jour, non applicables, les indicateurs supprimés, les chantiers non publiés et hors périmètre",
    createIntegrationTest(async () => {
      // Given
      const chantier = await creerChantierAvecTerritoires({ id: "CH-902" });
      const chantierBrouillon = await creerChantierAvecTerritoires({
        id: "CH-903",
        statut: $Enums.type_statut.BROUILLON,
      });
      const chantierHorsPerimetre = await creerChantierAvecTerritoires({
        id: "CH-904",
      });
      const indicateurAJour = await fixtures.indicateurIdentite({
        id: "IND-902",
        chantier_id: chantier.id,
      });
      const indicateurNonApplicable = await fixtures.indicateurIdentite({
        id: "IND-903",
        chantier_id: chantier.id,
      });
      const indicateurSupprime = await fixtures.indicateurIdentite({
        id: "IND-904",
        chantier_id: chantier.id,
        statut: $Enums.type_statut_indicateur.SUPPRIME,
      });
      const indicateurBrouillon = await fixtures.indicateurIdentite({
        id: "IND-905",
        chantier_id: chantierBrouillon.id,
      });
      const indicateurHorsPerimetre = await fixtures.indicateurIdentite({
        id: "IND-906",
        chantier_id: chantierHorsPerimetre.id,
      });
      const ligne = (id: string, chantierId: string, surcharge: object) =>
        fixtures.indicateurTerritoire({
          id,
          chantier_id: chantierId,
          territoire_code: "NAT-FR",
          est_applicable: true,
          est_a_jour: false,
          valeur_initiale: 1,
          ...surcharge,
        });
      await ligne(indicateurAJour.id, chantier.id, { est_a_jour: true });
      await ligne(indicateurNonApplicable.id, chantier.id, {
        est_applicable: false,
      });
      await ligne(indicateurSupprime.id, chantier.id, {});
      await ligne(indicateurBrouillon.id, chantierBrouillon.id, {});
      await ligne(indicateurHorsPerimetre.id, chantierHorsPerimetre.id, {});

      // When
      const resultat = await query.run(
        [chantier.id, chantierBrouillon.id],
        JALON,
      );

      // Then
      expect(resultat).toEqual({ nonAJour: [], aParametrer: [] });
    }),
  );

  it(
    "liste les indicateurs sans valeur initiale ou sans cible pour le jalon",
    createIntegrationTest(async () => {
      // Given
      const chantier = await creerChantierAvecTerritoires({ id: "CH-905" });
      const indicateur = await fixtures.indicateurIdentite({
        id: "IND-907",
        chantier_id: chantier.id,
        nom: "Taux de recours",
        periodicite: "Annuelle",
      });
      // DEPT-02 est applicable et entièrement paramétré : compté uniquement dans les territoires applicables
      await fixtures.chantierTerritoire({
        id: chantier.id,
        territoire_code: "DEPT-02",
        zone_id: "D02",
        code_insee: "02",
        maille: $Enums.Maille.DEPT,
      });
      await fixtures.indicateurTerritoire({
        id: indicateur.id,
        chantier_id: chantier.id,
        territoire_code: "DEPT-02",
        zone_id: "D02",
        code_insee: "02",
        maille: $Enums.Maille.DEPT,
        est_applicable: true,
        est_a_jour: true,
        valeur_initiale: 3,
      });
      await fixtures.indicateurTerritoire({
        id: indicateur.id,
        chantier_id: chantier.id,
        territoire_code: "NAT-FR",
        est_applicable: true,
        est_a_jour: true,
        valeur_initiale: null,
      });
      await fixtures.indicateurTerritoire({
        id: indicateur.id,
        chantier_id: chantier.id,
        ...territoireDept01,
        est_applicable: true,
        est_a_jour: true,
        valeur_initiale: 5,
      });
      await fixtures.indicateurTerritoireJalon({
        id: indicateur.id,
        ...territoireDept01,
        jalon: JALON,
        valeur_cible: null,
      });

      // When
      const resultat = await query.run([chantier.id], JALON);

      // Then
      expect(resultat).toEqual({
        nonAJour: [],
        aParametrer: [
          {
            chantierId: "CH-905",
            chantierNom: "Chantier CH-905",
            indicateurId: "IND-907",
            nom: "Taux de recours",
            periodicite: "Annuelle",
            manques: ["VALEUR_INITIALE", "VALEUR_CIBLE"],
            nbTerritoires: 2,
            nbTerritoiresApplicables: 3,
          },
        ],
      });
    }),
  );
});
