import { createIntegrationTest } from "@/server/infrastructure/test/createIntegrationTest";
import { fixtures } from "@/server/infrastructure/test/fixtures";
import { PrismaPilote } from "@/server/db/PrismaPilote";
import { RecupererMesuresIndicateurParPeriodeQuery } from "@/server/chantiers/infrastructure/queries/RecupererMesuresIndicateurParPeriodeQuery";

describe("RecupererMesuresIndicateurParPeriodeQuery", () => {
  let query: RecupererMesuresIndicateurParPeriodeQuery;
  const prismaPilote = new PrismaPilote();

  beforeEach(() => {
    query = new RecupererMesuresIndicateurParPeriodeQuery({
      prisma: prismaPilote,
    });
  });

  it(
    "retourne un tableau vide quand indicateurIds est vide",
    createIntegrationTest(async () => {
      // When
      const result = await query.execute({
        indicateurIds: [],
        territoireCodes: ["DEPT-12"],
        dateDebut: new Date("2024-01-01"),
        dateFin: new Date("2024-01-31"),
        typesValeur: ["VALEUR_INITIALE"],
      });

      // Then
      expect(result).toEqual([]);
    }),
  );

  it(
    "retourne un tableau vide quand territoireCodes est vide",
    createIntegrationTest(async () => {
      // When
      const result = await query.execute({
        indicateurIds: ["IND-001"],
        territoireCodes: [],
        dateDebut: new Date("2024-01-01"),
        dateFin: new Date("2024-01-31"),
        typesValeur: ["VALEUR_INITIALE"],
      });

      // Then
      expect(result).toEqual([]);
    }),
  );

  it(
    "retourne un tableau vide quand typesValeur est vide",
    createIntegrationTest(async () => {
      // When
      const result = await query.execute({
        indicateurIds: ["IND-001"],
        territoireCodes: ["DEPT-12"],
        dateDebut: new Date("2024-01-01"),
        dateFin: new Date("2024-01-31"),
        typesValeur: [],
      });

      // Then
      expect(result).toEqual([]);
    }),
  );

  it(
    "retourne les mesures VI dans la période donnée",
    createIntegrationTest(async () => {
      // Given
      const dateImport = new Date("2024-01-15T10:00:00Z");
      const chantier = await fixtures.chantierIdentite();
      const indicateurIdentite = await fixtures.indicateurIdentite({
        id: "IND-001",
        nom: "Indicateur Test",
        chantier_id: chantier.id,
      });
      const mesure = await fixtures.mesureIndicateur({
        indic_id: indicateurIdentite.id,
        zone_id: "D12",
        metric_date: "2024-01-01",
        metric_type: "vi",
        metric_value: "100",
        date_import: dateImport,
      });

      // When
      const result = await query.execute({
        indicateurIds: [indicateurIdentite.id],
        territoireCodes: ["DEPT-12"],
        dateDebut: new Date("2024-01-01"),
        dateFin: new Date("2024-01-31"),
        typesValeur: ["VALEUR_INITIALE"],
      });

      // Then
      expect(result).toEqual([
        {
          id: mesure.id,
          indicateurId: indicateurIdentite.id,
          indicateurNom: indicateurIdentite.nom,
          territoireCode: "DEPT-12",
          territoireNom: "Aveyron",
          typeValeur: "VALEUR_INITIALE",
          dateValeur: new Date("2024-01-01"),
          valeur: 100,
          dateImport,
        },
      ]);
    }),
  );

  it(
    "retourne les mesures VC dans la période donnée",
    createIntegrationTest(async () => {
      // Given
      const dateImport = new Date("2024-01-15T10:00:00Z");
      const chantier = await fixtures.chantierIdentite();
      const indicateurIdentite = await fixtures.indicateurIdentite({
        id: "IND-002",
        nom: "Indicateur Cible",
        chantier_id: chantier.id,
      });
      const mesure = await fixtures.mesureIndicateur({
        indic_id: indicateurIdentite.id,
        zone_id: "R93",
        metric_date: "2024-01-01",
        metric_type: "vc",
        metric_value: "200",
        date_import: dateImport,
      });

      // When
      const result = await query.execute({
        indicateurIds: [indicateurIdentite.id],
        territoireCodes: ["REG-93"],
        dateDebut: new Date("2024-01-01"),
        dateFin: new Date("2024-01-31"),
        typesValeur: ["VALEUR_CIBLE"],
      });

      // Then
      expect(result).toEqual([
        {
          id: mesure.id,
          indicateurId: indicateurIdentite.id,
          indicateurNom: indicateurIdentite.nom,
          territoireCode: "REG-93",
          territoireNom: "Provence - Alpes - Côte d'Azur",
          typeValeur: "VALEUR_CIBLE",
          dateValeur: new Date("2024-01-01"),
          valeur: 200,
          dateImport,
        },
      ]);
    }),
  );

  it(
    "retourne à la fois VI et VC quand typesValeur contient les deux",
    createIntegrationTest(async () => {
      // Given
      const dateImport = new Date("2024-01-15T10:00:00Z");
      const chantier = await fixtures.chantierIdentite();
      const indicateurIdentite = await fixtures.indicateurIdentite({
        id: "IND-003",
        nom: "Indicateur Multiple",
        chantier_id: chantier.id,
      });
      const mesureVI = await fixtures.mesureIndicateur({
        indic_id: indicateurIdentite.id,
        zone_id: "FRANCE",
        metric_date: "2024-01-01",
        metric_type: "vi",
        metric_value: "100",
        date_import: dateImport,
      });
      const mesureVC = await fixtures.mesureIndicateur({
        indic_id: indicateurIdentite.id,
        zone_id: "FRANCE",
        metric_date: "2024-01-01",
        metric_type: "vc",
        metric_value: "200",
        date_import: dateImport,
      });

      // When
      const result = await query.execute({
        indicateurIds: [indicateurIdentite.id],
        territoireCodes: ["NAT-FR"],
        dateDebut: new Date("2024-01-01"),
        dateFin: new Date("2024-01-31"),
        typesValeur: ["VALEUR_INITIALE", "VALEUR_CIBLE"],
      });

      // Then
      expect(result).toEqual([
        {
          id: mesureVI.id,
          indicateurId: indicateurIdentite.id,
          indicateurNom: indicateurIdentite.nom,
          territoireCode: "NAT-FR",
          territoireNom: "France",
          typeValeur: "VALEUR_INITIALE",
          dateValeur: new Date("2024-01-01"),
          valeur: 100,
          dateImport,
        },
        {
          id: mesureVC.id,
          indicateurId: indicateurIdentite.id,
          indicateurNom: indicateurIdentite.nom,
          territoireCode: "NAT-FR",
          territoireNom: "France",
          typeValeur: "VALEUR_CIBLE",
          dateValeur: new Date("2024-01-01"),
          valeur: 200,
          dateImport,
        },
      ]);
    }),
  );

  it(
    "exclut les mesures hors période",
    createIntegrationTest(async () => {
      // Given
      const chantier = await fixtures.chantierIdentite();
      const indicateurIdentite = await fixtures.indicateurIdentite({
        id: "IND-004",
        nom: "Indicateur Filtré",
        chantier_id: chantier.id,
      });
      await fixtures.mesureIndicateur({
        indic_id: indicateurIdentite.id,
        zone_id: "D75",
        metric_date: "2024-01-01",
        metric_type: "vi",
        metric_value: "100",
        date_import: new Date("2023-12-31T23:59:59Z"),
      });
      await fixtures.mesureIndicateur({
        indic_id: indicateurIdentite.id,
        zone_id: "D75",
        metric_date: "2024-01-01",
        metric_type: "vi",
        metric_value: "200",
        date_import: new Date("2024-02-01T00:00:01Z"),
      });

      // When
      const result = await query.execute({
        indicateurIds: [indicateurIdentite.id],
        territoireCodes: ["DEPT-75"],
        dateDebut: new Date("2024-01-01T00:00:00Z"),
        dateFin: new Date("2024-01-31T23:59:59Z"),
        typesValeur: ["VALEUR_INITIALE"],
      });

      // Then
      expect(result).toEqual([]);
    }),
  );

  it(
    "gère les valeurs nulles correctement",
    createIntegrationTest(async () => {
      // Given
      const dateImport = new Date("2024-01-15T10:00:00Z");
      const chantier = await fixtures.chantierIdentite();
      const indicateurIdentite = await fixtures.indicateurIdentite({
        id: "IND-005",
        nom: "Indicateur Null",
        chantier_id: chantier.id,
      });
      const mesure = await fixtures.mesureIndicateur({
        indic_id: indicateurIdentite.id,
        zone_id: "D13",
        metric_date: "2024-01-01",
        metric_type: "vi",
        metric_value: "",
        date_import: dateImport,
      });

      // When
      const result = await query.execute({
        indicateurIds: [indicateurIdentite.id],
        territoireCodes: ["DEPT-13"],
        dateDebut: new Date("2024-01-01"),
        dateFin: new Date("2024-01-31"),
        typesValeur: ["VALEUR_INITIALE"],
      });

      // Then
      expect(result).toEqual([
        {
          id: mesure.id,
          indicateurId: indicateurIdentite.id,
          indicateurNom: indicateurIdentite.nom,
          territoireCode: "DEPT-13",
          territoireNom: "Bouches-du-Rhône",
          typeValeur: "VALEUR_INITIALE",
          dateValeur: new Date("2024-01-01"),
          valeur: null,
          dateImport,
        },
      ]);
    }),
  );
});
