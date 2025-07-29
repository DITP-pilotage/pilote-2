import Alerte from "@/server/domain/alerte/Alerte";

describe("Alerte", () => {
  describe("estEnAlerteÉcart", () => {
    test("le chantier est en alerte si le taux d'avancement du territoire à au minimum 10 points de moins que le taux d'avancement du territoire national", () => {
      // Given
      const tauxAvancementDuTerritoire = 50;
      const tauxAvancementNational = 61;
      const écart = tauxAvancementDuTerritoire - tauxAvancementNational;

      // When
      const estEnAlerteÉcart = Alerte.estEnAlerteÉcart(écart);

      // Then
      expect(estEnAlerteÉcart).toBeTruthy();
    });

    test("le chantier n'est pas en alerte si le taux d'avancement du territoire et du territoire national sont égaux", () => {
      // Given
      const tauxAvancementDuTerritoire = 55;
      const tauxAvancementNational = 55;
      const écart = tauxAvancementDuTerritoire - tauxAvancementNational;

      // When
      const estEnAlerteÉcart = Alerte.estEnAlerteÉcart(écart);

      // Then
      expect(estEnAlerteÉcart).toBeFalsy();
    });

    test("le chantier n'est pas en alerte si le taux d'avancement du territoire n'est pas en retard de plus de 10 points par rapport au taux d'avancement du territoire national", () => {
      // Given
      const tauxAvancementDuTerritoire = 71;
      const tauxAvancementNational = 80;
      const écart = tauxAvancementDuTerritoire - tauxAvancementNational;

      // When
      const estEnAlerteÉcart = Alerte.estEnAlerteÉcart(écart);

      // Then
      expect(estEnAlerteÉcart).toBeFalsy();
    });
  });

  describe("estEnAlerteBaisse", () => {
    test("le chantier n'est pas en alerte si la tendance est null", () => {
      // Given
      const tendance = null;

      // When
      const estEnAlerteBaisse = Alerte.estEnAlerteBaisse(tendance);

      // Then
      expect(estEnAlerteBaisse).toBeFalsy();
    });

    test("le chantier est en alerte si la tendance est en baisse", () => {
      // Given
      const tendance = "BAISSE";

      // When
      const estEnAlerteBaisse = Alerte.estEnAlerteBaisse(tendance);

      // Then
      expect(estEnAlerteBaisse).toBeTruthy();
    });

    test("le chantier n'est pas en alerte si la tendance est en hausse", () => {
      // Given
      const tendance = "HAUSSE";

      // When
      const estEnAlerteBaisse = Alerte.estEnAlerteBaisse(tendance);

      // Then
      expect(estEnAlerteBaisse).toBeFalsy();
    });

    test("le chantier n'est pas en alerte si la tendance est en stagnation", () => {
      // Given
      const tendance = "STAGNATION";

      // When
      const estEnAlerteBaisse = Alerte.estEnAlerteBaisse(tendance);

      // Then
      expect(estEnAlerteBaisse).toBeFalsy();
    });
  });

  describe("estEnAlerteTauxAvancementNonCalculé", () => {
    test("le chantier est en alerte si le taux d'avancement est null et qu'une cible est attendu", () => {
      // Given
      const tauxAvancement = null;

      // When
      const estEnAlerteTauxAvancementNonCalculé =
        Alerte.estEnAlerteTauxAvancementNonCalculé(tauxAvancement, true);

      // Then
      expect(estEnAlerteTauxAvancementNonCalculé).toBeTruthy();
    });

    test("le chantier n'est pas en alerte si le taux d'avancement est non null et qu'une cible est attendue", () => {
      // Given
      const tauxAvancement = 55;

      // When
      const estEnAlerteTauxAvancementNonCalculé =
        Alerte.estEnAlerteTauxAvancementNonCalculé(tauxAvancement, true);

      // Then
      expect(estEnAlerteTauxAvancementNonCalculé).toBeFalsy();
    });
    test("le chantier n'est pas en alerte si le taux d'avancement null et qu'une cible n'est pas attendue", () => {
      // Given
      const tauxAvancement = null;

      // When
      const estEnAlerteTauxAvancementNonCalculé =
        Alerte.estEnAlerteTauxAvancementNonCalculé(tauxAvancement, false);

      // Then
      expect(estEnAlerteTauxAvancementNonCalculé).toBeFalsy();
    });
    test("le chantier n'est pas en alerte si le taux d'avancement non null et qu'une cible n'est pas attendue", () => {
      // Given
      const tauxAvancement = 55;

      // When
      const estEnAlerteTauxAvancementNonCalculé =
        Alerte.estEnAlerteTauxAvancementNonCalculé(tauxAvancement, false);

      // Then
      expect(estEnAlerteTauxAvancementNonCalculé).toBeFalsy();
    });
  });

  describe("estEnAlerteMétéoNonRenseignée", () => {
    test("Le chantier est en alerte si la météo n est pas renseignée", () => {
      // Given
      const meteo = "NON_RENSEIGNEE";
      // When
      const estEnAlerteMétéoNonRenseignée =
        Alerte.estEnAlerteMétéoNonRenseignée(meteo);
      // Then
      expect(estEnAlerteMétéoNonRenseignée).toBeTruthy();
    });

    test("Le chantier n est pas en alerte si la météo est renseignée", () => {
      // Given
      const meteo = "SOLEIL";
      // When
      const estEnAlerteMétéoNonRenseignée =
        Alerte.estEnAlerteMétéoNonRenseignée(meteo);
      // Then
      expect(estEnAlerteMétéoNonRenseignée).toBeFalsy();
    });
  });

  describe("estEnAlerteAbscenceTauxAvancementDepartemental", () => {
    test("le chantier est en alerte s'il n'a pas de taux avancement au niveau departemental et qu'une valeur cible est attendue", () => {
      // Given
      const aUnTauxAvancementDepartemental = false;
      const cibleAttendue = true;
      // When
      const estEnAlerteAbscenceTauxAvancementDepartemental =
        Alerte.estEnAlerteAbscenceTauxAvancementDepartemental(
          aUnTauxAvancementDepartemental,
          cibleAttendue,
        );

      // Then
      expect(estEnAlerteAbscenceTauxAvancementDepartemental).toBeTruthy();
    });

    test("le chantier n'est pas en alerte si une valeur cible n'est pas attendue", () => {
      // Given
      const aUnTauxAvancementDepartemental = false;
      const cibleAttendue = false;

      // When
      const estEnAlerteAbscenceTauxAvancementDepartemental =
        Alerte.estEnAlerteAbscenceTauxAvancementDepartemental(
          aUnTauxAvancementDepartemental,
          cibleAttendue,
        );

      // Then
      expect(estEnAlerteAbscenceTauxAvancementDepartemental).toBeFalse();
    });
  });

  describe("estEnAlertePossedePropositionsValeurAvancement", () => {
    test("le chantier est en alerte s'il possède au moins une proposition de valeur actuelle", () => {
      //Given
      const aUnePropositionsValeurAvancement = true;

      // When
      const estEnAlertePossedePropositionsValeurAvancement =
        Alerte.estEnAlertePossedePropositionsValeurAvancement(
          aUnePropositionsValeurAvancement,
        );

      // Then
      expect(estEnAlertePossedePropositionsValeurAvancement).toBeTruthy();
    });

    test("le chantier n'est pas en alerte s'il possède aucune proposition de valeur actuelle", () => {
      //Given
      const aUnePropositionsValeurAvancement = false;

      // When
      const estEnAlertePossedePropositionsValeurAvancement =
        Alerte.estEnAlertePossedePropositionsValeurAvancement(
          aUnePropositionsValeurAvancement,
        );

      // Then
      expect(estEnAlertePossedePropositionsValeurAvancement).toBeFalsy();
    });
  });
});
