import Alerte from '@/server/domain/alerte/Alerte';

describe('Alerte', () => {
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
