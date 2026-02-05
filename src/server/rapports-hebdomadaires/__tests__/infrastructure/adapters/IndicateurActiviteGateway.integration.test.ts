import { createIntegrationTest } from "@/server/infrastructure/test/createIntegrationTest";
import { fixtures } from "@/server/infrastructure/test/fixtures";
import { PrismaPilote } from "@/server/db/PrismaPilote";
import { IndicateurActiviteGateway } from "@/server/rapports-hebdomadaires/infrastructure/adapters/IndicateurActiviteGateway";
import { RecupererEvenementsVAParPeriodeQuery } from "@/server/indicateur-territoire-valeur-evenement/infrastructure/queries/RecupererEvenementsVAParPeriodeQuery";
import { RecupererMesuresIndicateurParPeriodeQuery } from "@/server/chantiers/infrastructure/queries/RecupererMesuresIndicateurParPeriodeQuery";

describe("IndicateurActiviteGateway", () => {
  let gateway: IndicateurActiviteGateway;
  const prismaPilote = new PrismaPilote();

  beforeEach(() => {
    const evenementsVAQuery = new RecupererEvenementsVAParPeriodeQuery({
      prisma: prismaPilote,
    });
    const mesuresIndicateurQuery =
      new RecupererMesuresIndicateurParPeriodeQuery({
        prisma: prismaPilote,
      });

    gateway = new IndicateurActiviteGateway({
      evenementsVAQuery,
      mesuresIndicateurQuery,
    });
  });

  it(
    "retourne les événements VA et VI/VC fusionnés",
    createIntegrationTest(async () => {
      // Given
      const dateDebut = new Date("2024-01-01T00:00:00Z");
      const dateFin = new Date("2024-01-31T23:59:59Z");

      const utilisateur = await fixtures.utilisateur();
      const chantier = await fixtures.chantierIdentite();
      await fixtures.chantierTerritoire({
        id: chantier.id,
        territoire_code: "DEPT-75",
      });
      const indicateurIdentite = await fixtures.indicateurIdentite({
        id: "IND-001",
        nom: "Indicateur Test",
        chantier_id: chantier.id,
      });
      const indicateurTerritoire = await fixtures.indicateurTerritoire({
        id: indicateurIdentite.id,
        territoire_code: "DEPT-75",
        chantier_id: chantier.id,
      });

      await fixtures.indicateurTerritoireValeurEvenement({
        indic_id: indicateurTerritoire.id,
        territoire_code: "DEPT-75",
        id_auteur_modification: utilisateur.id,
        type_evenement: "VALEUR_CREEE",
        type_valeur: "VALEUR_AVANCEMENT",
        date_valeur: new Date("2024-01-15"),
        valeur: 50,
        date_creation: new Date("2024-01-15T10:00:00Z"),
        ordre: 1,
      });

      await fixtures.mesureIndicateur({
        indic_id: indicateurIdentite.id,
        zone_id: "D75",
        metric_date: "2024-01-10",
        metric_type: "vi",
        metric_value: "100",
        date_import: new Date("2024-01-10T10:00:00Z"),
      });

      await fixtures.mesureIndicateur({
        indic_id: indicateurIdentite.id,
        zone_id: "D75",
        metric_date: "2024-01-10",
        metric_type: "vc",
        metric_value: "200",
        date_import: new Date("2024-01-10T10:00:00Z"),
      });

      // When
      const result = await gateway.recupererEvenementsDansPeriode({
        indicateurIds: [indicateurIdentite.id],
        territoireCodes: ["DEPT-75"],
        periode: { dateDebut, dateFin },
      });

      // Then
      expect(result).toHaveLength(3);
      expect(result).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            indicateur: {
              id: indicateurIdentite.id,
              nom: indicateurIdentite.nom,
            },
            territoire: {
              code: "DEPT-75",
              nom: "Paris",
            },
            typeValeur: "VALEUR_AVANCEMENT",
            valeur: 50,
            dateValeur: new Date("2024-01-15"),
          }),
          expect.objectContaining({
            indicateur: {
              id: indicateurIdentite.id,
              nom: indicateurIdentite.nom,
            },
            territoire: {
              code: "DEPT-75",
              nom: "Paris",
            },
            typeValeur: "VALEUR_INITIALE",
            valeur: 100,
            dateValeur: new Date("2024-01-10"),
          }),
          expect.objectContaining({
            indicateur: {
              id: indicateurIdentite.id,
              nom: indicateurIdentite.nom,
            },
            territoire: {
              code: "DEPT-75",
              nom: "Paris",
            },
            typeValeur: "VALEUR_CIBLE",
            valeur: 200,
            dateValeur: new Date("2024-01-10"),
          }),
        ]),
      );
    }),
  );

  it(
    "trie les événements par territoire code puis dateValeur",
    createIntegrationTest(async () => {
      // Given
      const dateDebut = new Date("2024-01-01T00:00:00Z");
      const dateFin = new Date("2024-01-31T23:59:59Z");

      const chantier = await fixtures.chantierIdentite();
      await fixtures.chantierTerritoire({
        id: chantier.id,
        territoire_code: "DEPT-75",
      });
      await fixtures.chantierTerritoire({
        id: chantier.id,
        territoire_code: "DEPT-92",
      });
      const indicateurIdentite = await fixtures.indicateurIdentite({
        id: "IND-002",
        nom: "Indicateur Tri",
        chantier_id: chantier.id,
      });

      await fixtures.indicateurTerritoire({
        id: indicateurIdentite.id,
        territoire_code: "DEPT-75",
        chantier_id: chantier.id,
      });
      await fixtures.indicateurTerritoire({
        id: indicateurIdentite.id,
        territoire_code: "DEPT-92",
        chantier_id: chantier.id,
      });

      await fixtures.mesureIndicateur({
        indic_id: indicateurIdentite.id,
        zone_id: "D92",
        metric_date: "2024-01-10",
        metric_type: "vi",
        metric_value: "300",
        date_import: new Date("2024-01-10T10:00:00Z"),
      });

      await fixtures.mesureIndicateur({
        indic_id: indicateurIdentite.id,
        zone_id: "D75",
        metric_date: "2024-01-20",
        metric_type: "vi",
        metric_value: "200",
        date_import: new Date("2024-01-20T10:00:00Z"),
      });

      await fixtures.mesureIndicateur({
        indic_id: indicateurIdentite.id,
        zone_id: "D75",
        metric_date: "2024-01-05",
        metric_type: "vc",
        metric_value: "100",
        date_import: new Date("2024-01-05T10:00:00Z"),
      });

      // When
      const result = await gateway.recupererEvenementsDansPeriode({
        indicateurIds: [indicateurIdentite.id],
        territoireCodes: ["DEPT-75", "DEPT-92"],
        periode: { dateDebut, dateFin },
      });

      // Then
      expect(result).toHaveLength(3);
      expect(result[0]).toMatchObject({
        territoire: { code: "DEPT-75" },
        dateValeur: new Date("2024-01-05"),
      });
      expect(result[1]).toMatchObject({
        territoire: { code: "DEPT-75" },
        dateValeur: new Date("2024-01-20"),
      });
      expect(result[2]).toMatchObject({
        territoire: { code: "DEPT-92" },
        dateValeur: new Date("2024-01-10"),
      });
    }),
  );

  it(
    "retourne un tableau vide quand aucun événement n'existe",
    createIntegrationTest(async () => {
      // Given
      const dateDebut = new Date("2024-01-01T00:00:00Z");
      const dateFin = new Date("2024-01-31T23:59:59Z");

      // When
      const result = await gateway.recupererEvenementsDansPeriode({
        indicateurIds: ["IND-INEXISTANT"],
        territoireCodes: ["DEPT-99"],
        periode: { dateDebut, dateFin },
      });

      // Then
      expect(result).toEqual([]);
    }),
  );

  it(
    "gère les valeurs null correctement",
    createIntegrationTest(async () => {
      // Given
      const dateDebut = new Date("2024-01-01T00:00:00Z");
      const dateFin = new Date("2024-01-31T23:59:59Z");

      const chantier = await fixtures.chantierIdentite();
      const indicateurIdentite = await fixtures.indicateurIdentite({
        id: "IND-003",
        nom: "Indicateur Null",
        chantier_id: chantier.id,
      });

      await fixtures.mesureIndicateur({
        indic_id: indicateurIdentite.id,
        zone_id: "D13",
        metric_date: "2024-01-15",
        metric_type: "vi",
        metric_value: "",
        date_import: new Date("2024-01-15T10:00:00Z"),
      });

      // When
      const result = await gateway.recupererEvenementsDansPeriode({
        indicateurIds: [indicateurIdentite.id],
        territoireCodes: ["DEPT-13"],
        periode: { dateDebut, dateFin },
      });

      // Then
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        typeValeur: "VALEUR_INITIALE",
        valeur: null,
      });
    }),
  );
});
