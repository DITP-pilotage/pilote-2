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
    test("le chantier n'est pas en alerte si le taux d'avancement précédent est inconnu", () => {
      // Given
      const tauxAvancement = 10;
      const tauxAvancementPrécédent = null;

      // When
      const estEnAlerteBaisseOuStagnation = Alerte.estEnAlerteBaisseOuStagnation(tauxAvancementPrécédent, tauxAvancement);

      // Then
      expect(estEnAlerteBaisseOuStagnation).toBeFalsy();
    });

    test("le chantier n'est pas en alerte si le taux d'avancement actuel est inconnu", () => {
      // Given
      const tauxAvancement = null;
      const tauxAvancementPrécédent = 11;

      // When
      const estEnAlerteBaisseOuStagnation = Alerte.estEnAlerteBaisseOuStagnation(tauxAvancementPrécédent, tauxAvancement);

      // Then
      expect(estEnAlerteBaisseOuStagnation).toBeFalsy();
    });

    test("le chantier est en alerte si le taux d'avancement actuel est inférieur au taux d'avancement précédent", () => {
      // Given
      const tauxAvancement = 10;
      const tauxAvancementPrécédent = 12;

      // When
      const estEnAlerteBaisseOuStagnation = Alerte.estEnAlerteBaisseOuStagnation(tauxAvancementPrécédent, tauxAvancement);

      // Then
      expect(estEnAlerteBaisseOuStagnation).toBeTruthy();
    });

    test("le chantier n'est pas en alerte si le taux d'avancement actuel est supérieur au taux d'avancement précédent", () => {
      // Given
      const tauxAvancement = 25;
      const tauxAvancementPrécédent = 20;

      // When
      const estEnAlerteBaisseOuStagnation = Alerte.estEnAlerteBaisseOuStagnation(tauxAvancementPrécédent, tauxAvancement);

      // Then
      expect(estEnAlerteBaisseOuStagnation).toBeFalsy();
    });

    test("le chantier est en alerte si le taux d'avancement actuel est égal au taux d'avancement précédent", () => {
      // Given
      const tauxAvancement = 22;
      const tauxAvancementPrécédent = 22;

      // When
      const estEnAlerteBaisseOuStagnation = Alerte.estEnAlerteBaisseOuStagnation(tauxAvancementPrécédent, tauxAvancement);

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
});