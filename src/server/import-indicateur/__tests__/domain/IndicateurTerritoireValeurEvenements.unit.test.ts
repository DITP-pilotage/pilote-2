import { IndicateurTerritoireValeurEvenements } from "@/server/import-indicateur/domain/IndicateurTerritoireValeurEvenements";
import { ValeurIndicateurTerritoireEvenementBuilder } from "@/server/import-indicateur/app/builder/ValeurIndicateurTerritoireEvenement.builder";
import { IndicateurData } from "@/server/import-indicateur/domain/IndicateurData";

describe("IndicateurTerritoireValeurEvenements", () => {
  const INDIC_ID = "IND-001";
  const TERRITOIRE_CODE = "DEPT-01";
  const AUTEUR_ID = "author-123";

  const createIndicateurData = (
    overrides: Partial<{
      indicId: string;
      metricDate: string;
      metricValue: string;
      zoneId: string;
    }> = {},
  ): IndicateurData => {
    return IndicateurData.createIndicateurData({
      rapportId: "rapport-123",
      zoneId: overrides.zoneId || "D01",
      indicId: overrides.indicId || INDIC_ID,
      metricType: "va",
      metricDate: overrides.metricDate || "2023-01-01",
      metricValue: overrides.metricValue || "75",
    });
  };

  describe("ingererIndicateurData", () => {
    it("should create VALEUR_CREEE event when no existing events", () => {
      const evenements = new IndicateurTerritoireValeurEvenements({
        indicId: INDIC_ID,
        territoireCode: TERRITOIRE_CODE,
      });

      const indicateurData = createIndicateurData();
      const nouveauxEvenements = evenements.ingererIndicateurData(
        indicateurData,
        AUTEUR_ID,
      );

      expect(nouveauxEvenements).toHaveLength(1);
      expect(nouveauxEvenements[0].typeEvenement).toEqual("VALEUR_CREEE");
      expect(nouveauxEvenements[0].valeur).toEqual(75);
      expect(nouveauxEvenements[0].ordre).toEqual(1);
      expect(nouveauxEvenements[0].dateValeur).toEqual(new Date("2023-01-01"));
    });

    it("should create VALEUR_MODIFIEE event when value differs for same date", () => {
      const evenementExistant = new ValeurIndicateurTerritoireEvenementBuilder()
        .avecIndicId(INDIC_ID)
        .avecTerritoireCode(TERRITOIRE_CODE)
        .avecTypeEvenement("VALEUR_CREEE")
        .avecDateValeur(new Date("2023-01-01"))
        .avecValeur(42)
        .avecOrdre(1)
        .build();

      const evenements = new IndicateurTerritoireValeurEvenements({
        indicId: INDIC_ID,
        territoireCode: TERRITOIRE_CODE,
        evenementsInitiaux: [evenementExistant],
      });

      const indicateurData = createIndicateurData({ metricValue: "85" });
      const nouveauxEvenements = evenements.ingererIndicateurData(
        indicateurData,
        AUTEUR_ID,
      );

      expect(nouveauxEvenements).toHaveLength(1);
      expect(nouveauxEvenements[0].typeEvenement).toEqual("VALEUR_MODIFIEE");
      expect(nouveauxEvenements[0].valeur).toEqual(85);
      expect(nouveauxEvenements[0].ordre).toEqual(2);
    });

    it("should not create event when value is identical for same date", () => {
      const evenementExistant = new ValeurIndicateurTerritoireEvenementBuilder()
        .avecIndicId(INDIC_ID)
        .avecTerritoireCode(TERRITOIRE_CODE)
        .avecTypeEvenement("VALEUR_CREEE")
        .avecDateValeur(new Date("2023-01-01"))
        .avecValeur(75)
        .avecOrdre(1)
        .build();

      const evenements = new IndicateurTerritoireValeurEvenements({
        indicId: INDIC_ID,
        territoireCode: TERRITOIRE_CODE,
        evenementsInitiaux: [evenementExistant],
      });

      const indicateurData = createIndicateurData({ metricValue: "75" });
      const nouveauxEvenements = evenements.ingererIndicateurData(
        indicateurData,
        AUTEUR_ID,
      );

      expect(nouveauxEvenements).toHaveLength(0);
    });

    it("should create historization event for past date then create new event", () => {
      const evenementExistant = new ValeurIndicateurTerritoireEvenementBuilder()
        .avecIndicId(INDIC_ID)
        .avecTerritoireCode(TERRITOIRE_CODE)
        .avecTypeEvenement("VALEUR_CREEE")
        .avecDateValeur(new Date("2023-01-01"))
        .avecValeur(42)
        .avecOrdre(1)
        .build();

      const evenements = new IndicateurTerritoireValeurEvenements({
        indicId: INDIC_ID,
        territoireCode: TERRITOIRE_CODE,
        evenementsInitiaux: [evenementExistant],
      });

      const indicateurData = createIndicateurData({
        metricDate: "2023-02-01",
        metricValue: "75",
      });
      const nouveauxEvenements = evenements.ingererIndicateurData(
        indicateurData,
        AUTEUR_ID,
      );

      expect(nouveauxEvenements).toHaveLength(2);

      // Premier événement: historisation de l'ancien
      expect(nouveauxEvenements[0].typeEvenement).toEqual("VALEUR_HISTORISEE");
      expect(nouveauxEvenements[0].dateValeur).toEqual(new Date("2023-01-01"));
      expect(nouveauxEvenements[0].valeur).toEqual(42);
      expect(nouveauxEvenements[0].ordre).toEqual(2);

      // Deuxième événement: création du nouveau
      expect(nouveauxEvenements[1].typeEvenement).toEqual("VALEUR_CREEE");
      expect(nouveauxEvenements[1].dateValeur).toEqual(new Date("2023-02-01"));
      expect(nouveauxEvenements[1].valeur).toEqual(75);
      expect(nouveauxEvenements[1].ordre).toEqual(1);
    });

    it("should create new event then historize it when future date exists", () => {
      const evenementFutur = new ValeurIndicateurTerritoireEvenementBuilder()
        .avecIndicId(INDIC_ID)
        .avecTerritoireCode(TERRITOIRE_CODE)
        .avecTypeEvenement("VALEUR_CREEE")
        .avecDateValeur(new Date("2023-02-01"))
        .avecValeur(42)
        .avecOrdre(1)
        .build();

      const evenements = new IndicateurTerritoireValeurEvenements({
        indicId: INDIC_ID,
        territoireCode: TERRITOIRE_CODE,
        evenementsInitiaux: [evenementFutur],
      });

      const indicateurData = createIndicateurData({
        metricDate: "2023-01-01",
        metricValue: "75",
      });
      const nouveauxEvenements = evenements.ingererIndicateurData(
        indicateurData,
        AUTEUR_ID,
      );

      expect(nouveauxEvenements).toHaveLength(2);

      // Premier événement: création du nouvel événement
      expect(nouveauxEvenements[0].typeEvenement).toEqual("VALEUR_CREEE");
      expect(nouveauxEvenements[0].dateValeur).toEqual(new Date("2023-01-01"));
      expect(nouveauxEvenements[0].valeur).toEqual(75);
      expect(nouveauxEvenements[0].ordre).toEqual(1);

      // Deuxième événement: historisation du nouvel événement
      expect(nouveauxEvenements[1].typeEvenement).toEqual("VALEUR_HISTORISEE");
      expect(nouveauxEvenements[1].dateValeur).toEqual(new Date("2023-01-01"));
      expect(nouveauxEvenements[1].valeur).toEqual(75);
      expect(nouveauxEvenements[1].ordre).toEqual(2);
    });

    it("should maintain correct ordre sequence per date", () => {
      const evenementExistant1 =
        new ValeurIndicateurTerritoireEvenementBuilder()
          .avecIndicId(INDIC_ID)
          .avecTerritoireCode(TERRITOIRE_CODE)
          .avecDateValeur(new Date("2023-01-01"))
          .avecOrdre(1)
          .build();

      const evenementExistant2 =
        new ValeurIndicateurTerritoireEvenementBuilder()
          .avecIndicId(INDIC_ID)
          .avecTerritoireCode(TERRITOIRE_CODE)
          .avecDateValeur(new Date("2023-01-01"))
          .avecOrdre(2)
          .build();

      const evenements = new IndicateurTerritoireValeurEvenements({
        indicId: INDIC_ID,
        territoireCode: TERRITOIRE_CODE,
        evenementsInitiaux: [evenementExistant1, evenementExistant2],
      });

      const indicateurData = createIndicateurData({ metricValue: "85" });
      const nouveauxEvenements = evenements.ingererIndicateurData(
        indicateurData,
        AUTEUR_ID,
      );

      expect(nouveauxEvenements).toHaveLength(1);
      expect(nouveauxEvenements[0].ordre).toEqual(3); // Next order for the same date
    });

    it("should handle multiple ingestions maintaining in-memory state", () => {
      const evenements = new IndicateurTerritoireValeurEvenements({
        indicId: INDIC_ID,
        territoireCode: TERRITOIRE_CODE,
      });

      // First ingestion: create initial event
      const indicateurData1 = createIndicateurData({
        metricDate: "2023-01-01",
        metricValue: "75",
      });
      const nouveauxEvenements1 = evenements.ingererIndicateurData(
        indicateurData1,
        AUTEUR_ID,
      );

      expect(nouveauxEvenements1).toHaveLength(1);
      expect(nouveauxEvenements1[0].typeEvenement).toEqual("VALEUR_CREEE");
      expect(nouveauxEvenements1[0].ordre).toEqual(1);

      // Second ingestion: should see first event in memory and create second event + historization
      const indicateurData2 = createIndicateurData({
        metricDate: "2023-02-01",
        metricValue: "85",
      });
      const nouveauxEvenements2 = evenements.ingererIndicateurData(
        indicateurData2,
        AUTEUR_ID,
      );

      expect(nouveauxEvenements2).toHaveLength(2);
      expect(nouveauxEvenements2[0].typeEvenement).toEqual("VALEUR_HISTORISEE");
      expect(nouveauxEvenements2[0].ordre).toEqual(2); // Next order for 2023-01-01
      expect(nouveauxEvenements2[1].typeEvenement).toEqual("VALEUR_CREEE");
      expect(nouveauxEvenements2[1].ordre).toEqual(1); // First order for 2023-02-01
    });
  });
});
