import Alerte from '@/server/domain/alerte/Alerte';

describe('Alerte', () => {
  describe('estEnAlerteÉcart', () => {
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

  describe('estEnAlerteBaisseOuStagnation', () => {
    test("le chantier n'est pas en alerte si la tendance est null", () => {
      // Given
      const tendance = null;

      // When
      const estEnAlerteBaisseOuStagnation = Alerte.estEnAlerteBaisseOuStagnation(tendance);

      // Then
      expect(estEnAlerteBaisseOuStagnation).toBeFalsy();
    });

    test('le chantier est en alerte si la tendance est en baisse', () => {
      // Given
      const tendance = 'BAISSE';

      // When
      const estEnAlerteBaisseOuStagnation = Alerte.estEnAlerteBaisseOuStagnation(tendance);

      // Then
      expect(estEnAlerteBaisseOuStagnation).toBeTruthy();
    });

    test("le chantier n'est pas en alerte si la tendance est en hausse", () => {
      // Given
      const tendance = 'HAUSSE';

      // When
      const estEnAlerteBaisseOuStagnation = Alerte.estEnAlerteBaisseOuStagnation(tendance);

      // Then
      expect(estEnAlerteBaisseOuStagnation).toBeFalsy();
    });

    test('le chantier est en alerte si la tendance est en stagnation', () => {
      // Given
      const tendance = 'STAGNATION';

      // When
      const estEnAlerteBaisseOuStagnation = Alerte.estEnAlerteBaisseOuStagnation(tendance);

      // Then
      expect(estEnAlerteBaisseOuStagnation).toBeTruthy();
    });
  });

  describe('estEnAlerteDonnéesNonMàj', () => {
    test('le chantier est en alerte quand la date des données qualitatives est antérieure à la date des données quantitatives', () => {
      // Given
      const dateDonnéesQualitatives = '2022-01-01';
      const dateDonnéesQuantitatives = '2023-12-31';

      // When
      const estEnAlerteDonnéesNonMàj = Alerte.estEnAlerteDonnéesNonMàj(dateDonnéesQualitatives, dateDonnéesQuantitatives);

      // Then
      expect(estEnAlerteDonnéesNonMàj).toBeTruthy();
    });

    test("le chantier n'est pas en alerte quand la date des données qualitatives est égale à la date des données quantitatives", () => {
      // Given
      const dateDonnéesQualitatives = '2023-01-01';
      const dateDonnéesQuantitatives = '2023-01-01';

      // When
      const estEnAlerteDonnéesNonMàj = Alerte.estEnAlerteDonnéesNonMàj(dateDonnéesQualitatives, dateDonnéesQuantitatives);

      // Then
      expect(estEnAlerteDonnéesNonMàj).toBeFalsy();
    });

    test("le chantier n'est pas en alerte quand la date des données qualitatives est postérieur à la date des données quantitatives", () => {
      // Given
      const dateDonnéesQualitatives = '2023-12-31';
      const dateDonnéesQuantitatives = '2022-01-01';

      // When
      const estEnAlerteDonnéesNonMàj = Alerte.estEnAlerteDonnéesNonMàj(dateDonnéesQualitatives, dateDonnéesQuantitatives);

      // Then
      expect(estEnAlerteDonnéesNonMàj).toBeFalsy();
    });

    test('le chantier est en alerte quand la date des données qualitatives est inconnue et que la date des données quantitatives est renseignée', () => {
      // Given
      const dateDonnéesQualitatives = null;
      const dateDonnéesQuantitatives = '2022-01-01';

      // When
      const estEnAlerteDonnéesNonMàj = Alerte.estEnAlerteDonnéesNonMàj(dateDonnéesQualitatives, dateDonnéesQuantitatives);

      // Then
      expect(estEnAlerteDonnéesNonMàj).toBeTruthy();
    });

    test("le chantier n'est pas en alerte quand la date des données qualitatives est renseignée et que la date des données quantitatives est inconnue", () => {
      // Given
      const dateDonnéesQualitatives = '2023-12-31';
      const dateDonnéesQuantitatives = null;

      // When
      const estEnAlerteDonnéesNonMàj = Alerte.estEnAlerteDonnéesNonMàj(dateDonnéesQualitatives, dateDonnéesQuantitatives);

      // Then
      expect(estEnAlerteDonnéesNonMàj).toBeFalsy();
    });

    test("le chantier n'est pas en alerte quand la date des données qualitatives et quantitatives sont inconnues", () => {
      // Given
      const dateDonnéesQualitatives = null;
      const dateDonnéesQuantitatives = null;

      // When
      const estEnAlerteDonnéesNonMàj = Alerte.estEnAlerteDonnéesNonMàj(dateDonnéesQualitatives, dateDonnéesQuantitatives);

      // Then
      expect(estEnAlerteDonnéesNonMàj).toBeFalsy();
    });
  });

  describe('estEnAlerteTauxAvancementNonCalculé', () => {
    test("le chantier est en alerte si le taux d'avancement est null", () => {
      // Given
      const tauxAvancement = null;

      // When
      const estEnAlerteTauxAvancementNonCalculé = Alerte.estEnAlerteTauxAvancementNonCalculé(tauxAvancement);

      // Then
      expect(estEnAlerteTauxAvancementNonCalculé).toBeTruthy();
    });

    test("le chantier n'est pas en alerte si le taux d'avancement est non null", () => {
      // Given
      const tauxAvancement = 55;

      // When
      const estEnAlerteTauxAvancementNonCalculé = Alerte.estEnAlerteTauxAvancementNonCalculé(tauxAvancement);

      // Then
      expect(estEnAlerteTauxAvancementNonCalculé).toBeFalsy();
    });
  });

  describe('estEnAlerteMétéoNonRenseignée', () =>{
    test('Le chantier est en alerte si la météo n est pas renseignée', () =>{
      // Given
      const meteo = 'NON_RENSEIGNEE';
      // When
      const estEnAlerteMétéoNonRenseignée = Alerte.estEnAlerteMétéoNonRenseignée(meteo);
      // Then
      expect(estEnAlerteMétéoNonRenseignée).toBeTruthy();
    });

    test('Le chantier n est pas en alerte si la météo est renseignée', () =>{
      // Given
      const meteo = 'SOLEIL';
      // When
      const estEnAlerteMétéoNonRenseignée = Alerte.estEnAlerteMétéoNonRenseignée(meteo);
      // Then
      expect(estEnAlerteMétéoNonRenseignée).toBeFalsy();
    });
  });
});
